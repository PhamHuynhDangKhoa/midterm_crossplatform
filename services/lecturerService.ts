import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Lecturer, LecturerInput, LecturerSortKey } from "../types";

export const LECTURERS_COLLECTION = "GiangVien";

const MAX_FULLNAME_LEN = 100;
const MAX_SUM_CLASS = 1000;
const MAX_IMAGE_LEN = 300000;

export function formatLecturerId(seq: number): string {
  return `GV${String(Math.max(1, seq)).padStart(3, "0")}`;
}

/** Computes the next sequential GV001..GV999+ code from existing lecturer records. */
export function getNextLecturerId(items: Pick<Lecturer, "IDGV">[]): string {
  let maxNum = 0;
  for (const item of items) {
    const match = /^GV(\d+)$/i.exec(item.IDGV.trim());
    if (match) {
      const parsed = Number(match[1]);
      if (Number.isInteger(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }
  return formatLecturerId(maxNum + 1);
}

/** Validates and trims strictly the 4 allowed QLHocPhan.GiangVien fields. */
export function normalizeLecturerInput(input: LecturerInput): Lecturer {
  const IDGV = input.IDGV.trim();
  const Fullname = input.Fullname.trim();
  const Image = input.Image.trim();
  const SumClass = Number(input.SumClass);

  if (!IDGV) {
    throw new Error("Lecturer ID (IDGV) is required.");
  }
  if (IDGV.length > 40) {
    throw new Error("Lecturer ID cannot exceed 40 characters.");
  }
  if (IDGV.includes("/") || IDGV === "." || IDGV === "..") {
    throw new Error('Invalid lecturer ID (cannot contain "/").');
  }
  if (!Fullname) {
    throw new Error("Enter the lecturer full name.");
  }
  if (Fullname.length > MAX_FULLNAME_LEN) {
    throw new Error(`Full name cannot exceed ${MAX_FULLNAME_LEN} characters.`);
  }
  if (!Number.isInteger(SumClass) || SumClass < 0 || SumClass > MAX_SUM_CLASS) {
    throw new Error(
      `Total classes must be a whole number from 0 to ${MAX_SUM_CLASS}.`,
    );
  }
  if (Image.length > MAX_IMAGE_LEN) {
    throw new Error(
      "Image exceeds storage limit. Pick a smaller photo or use an image URL.",
    );
  }

  return { IDGV, Fullname, Image, SumClass };
}

/** Real-time subscription to QLHocPhan -> GiangVien sorted by IDGV. */
export function subscribeLecturers(
  onData: (items: Lecturer[]) => void,
  onError: (message: string) => void,
): () => void {
  const q = query(collection(db, LECTURERS_COLLECTION), orderBy("IDGV", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Lecturer[] = snapshot.docs.map((snap) => {
        const data = snap.data() as Partial<Lecturer>;
        return {
          IDGV:
            typeof data.IDGV === "string" && data.IDGV ? data.IDGV : snap.id,
          Fullname: typeof data.Fullname === "string" ? data.Fullname : "",
          Image: typeof data.Image === "string" ? data.Image : "",
          SumClass:
            typeof data.SumClass === "number"
              ? data.SumClass
              : Number(data.SumClass ?? 0),
        };
      });
      onData(items);
    },
    (err) => {
      onError(err.message || "Could not load lecturers.");
    },
  );
}

/** Auto-assigns the next free sequential IDGV and saves a strict 4-field document. */
export async function addLecturerAuto(
  input: Omit<LecturerInput, "IDGV">,
): Promise<Lecturer> {
  const snapshot = await getDocs(collection(db, LECTURERS_COLLECTION));
  const currentIds = snapshot.docs.map((snap) => ({ IDGV: snap.id }));
  const firstCandidate = getNextLecturerId(currentIds);
  let seq = Number(firstCandidate.replace(/^GV/i, "")) || 1;

  for (let attempts = 0; attempts < 50; attempts++) {
    const candidateId = formatLecturerId(seq + attempts);
    const ref = doc(db, LECTURERS_COLLECTION, candidateId);
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      const clean = normalizeLecturerInput({ ...input, IDGV: candidateId });
      await setDoc(ref, clean);
      return clean;
    }
  }

  throw new Error("Could not assign a unique sequential lecturer ID.");
}

/** Adds a lecturer using an explicit IDGV as the Firestore document ID. */
export async function addLecturer(input: LecturerInput): Promise<void> {
  const clean = normalizeLecturerInput(input);
  const ref = doc(db, LECTURERS_COLLECTION, clean.IDGV);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    throw new Error(`Lecturer ID "${clean.IDGV}" already exists.`);
  }
  await setDoc(ref, clean);
}

/** Updates a lecturer, atomically migrating the document if IDGV changed. */
export async function editLecturer(
  previousIDGV: string,
  input: LecturerInput,
): Promise<void> {
  const clean = normalizeLecturerInput(input);
  const oldRef = doc(db, LECTURERS_COLLECTION, previousIDGV);

  if (clean.IDGV === previousIDGV) {
    await updateDoc(oldRef, {
      IDGV: clean.IDGV,
      Fullname: clean.Fullname,
      Image: clean.Image,
      SumClass: clean.SumClass,
    });
    return;
  }

  const newRef = doc(db, LECTURERS_COLLECTION, clean.IDGV);
  const duplicate = await getDoc(newRef);
  if (duplicate.exists()) {
    throw new Error(`Lecturer ID "${clean.IDGV}" already exists.`);
  }

  const batch = writeBatch(db);
  batch.set(newRef, clean);
  batch.delete(oldRef);
  await batch.commit();
}

export async function removeLecturer(idgv: string): Promise<void> {
  await deleteDoc(doc(db, LECTURERS_COLLECTION, idgv));
}

export function filterAndSortLecturers(
  items: Lecturer[],
  keyword: string,
  sortBy: LecturerSortKey,
): Lecturer[] {
  const term = keyword.trim().toLowerCase();
  const filtered = term
    ? items.filter(
        (item) =>
          item.IDGV.toLowerCase().includes(term) ||
          item.Fullname.toLowerCase().includes(term),
      )
    : [...items];

  filtered.sort((a, b) => {
    if (sortBy === "nameAsc") {
      return a.Fullname.localeCompare(b.Fullname, undefined, {
        sensitivity: "base",
      });
    }
    if (sortBy === "sumDesc") {
      const diff = b.SumClass - a.SumClass;
      return diff !== 0
        ? diff
        : a.IDGV.localeCompare(b.IDGV, undefined, {
            numeric: true,
            sensitivity: "base",
          });
    }
    return a.IDGV.localeCompare(b.IDGV, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  return filtered;
}

export function serializeLecturersJson(items: Lecturer[]): string {
  const strictRows: Lecturer[] = items.map(
    ({ IDGV, Fullname, Image, SumClass }) => ({
      IDGV,
      Fullname,
      Image,
      SumClass,
    }),
  );
  return JSON.stringify(strictRows, null, 2);
}
