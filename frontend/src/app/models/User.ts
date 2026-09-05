export interface User {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  password?: string;
  phone: number;
  actif: boolean;
  role?: string;
  dateCreation?: Date | string;
}