type SignInData = {
  email: string;
  password: string;
};

type SignUpData = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  user_type: "tenant" | "landlord";
};
