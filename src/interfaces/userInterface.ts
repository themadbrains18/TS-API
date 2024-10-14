export interface User {
  id: number;
  name: string; 
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  // You can add related fields if needed, like templates if you plan to include them later
  templates?: Template[]; // Optional field for user-related templates
}

export interface Template {
  id: number;
  title: string;
  price: number;
  category: string;
  designerId: number;
  createdAt: Date;
  updatedAt: Date;
}

