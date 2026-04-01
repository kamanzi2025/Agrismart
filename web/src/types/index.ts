export type Role = 'FARMER' | 'EXTENSION_OFFICER' | 'COOPERATIVE_LEADER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  location?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface Farmer {
  id: string;
  userId: string;
  cooperativeId?: string;
  totalLandAcres?: number;
  pestReportCount?: number;
  user: { id: string; name: string; phone: string; location?: string; createdAt: string };
}

export interface PestReport {
  id: string;
  farmerId: string;
  pestName?: string;
  status: 'PENDING' | 'ANALYZED' | 'RESOLVED';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  imageUrl?: string;
  aiDiagnosis?: string;
  officerNotes?: string;
  createdAt: string;
  farmer?: { user: { name: string; phone: string } };
}

export interface Advisory {
  id: string;
  title: string;
  content: string;
  cropType: string;
  season?: string;
  targetLocation?: string;
  authorId: string;
  author?: { name: string };
  createdAt: string;
}

export interface Cooperative {
  id: string;
  name: string;
  region: string;
  leaderId: string;
  leader?: { name: string };
}
