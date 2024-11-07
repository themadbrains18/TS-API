/**
 * User Interface.
 * 
 * This interface defines the structure of a user object in the system, including essential details about the user and their associated templates. It is used to represent user data throughout the application.
 * 
 * The `User` interface includes the following fields:
 * 
 * - `id`: A unique identifier for the user, represented as a number.
 * - `name`: A required string representing the user's name.
 * - `email`: A required string representing the user's email address.
 * - `password`: A required string storing the user's hashed password.
 * - `createdAt`: A `Date` object representing the timestamp when the user was created.
 * - `updatedAt`: A `Date` object representing the timestamp of the last time the user's information was updated.
 * - `templates`: An optional array of `Template` objects representing the templates created or owned by the user.
 */
export interface User {
  id: number;
  name: string; 
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  templates?: Template[]; // Optional field for user's associated templates
}

/**
 * Template Interface.
 * 
 * This interface defines the structure of a template object in the system, providing details about the template and its designer. It is used to represent template data throughout the application.
 * 
 * The `Template` interface includes the following fields:
 * 
 * - `id`: A unique identifier for the template, represented as a number.
 * - `title`: A required string representing the title of the template.
 * - `price`: A required number representing the price of the template.
 * - `category`: A required string representing the category the template belongs to.
 * - `designerId`: A number representing the ID of the user who designed or owns the template.
 * - `createdAt`: A `Date` object representing the timestamp when the template was created.
 * - `updatedAt`: A `Date` object representing the timestamp of the last time the template was updated.
 */
export interface Template {
  id: number;
  title: string;
  price: number;
  category: string;
  designerId: number;
  createdAt: Date;
  updatedAt: Date;
}
