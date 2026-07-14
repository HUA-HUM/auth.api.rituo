export interface EmailPasswordCredential {
  id: string;
  userId: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmailPasswordCredentialData {
  userId: string;
  email: string;
  passwordHash: string;
}
