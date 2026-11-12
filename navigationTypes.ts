import { Lecturer } from './types';

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  LecturerForm: { lecturer?: Lecturer; suggestedId?: string } | undefined;
};
