type UserProfile = {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  user_role?: "tenant" | "landlord" | "admin";
  push_token?: string;
  created_at: string;
  updated_at: string;
};

type Coordinates = {
  lat: number;
  lng: number;
};

type UserRole = {
  id: string;
  user_id: string;
  role: "tenant" | "landlord" | "admin";
};
