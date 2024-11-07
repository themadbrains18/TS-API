generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  USER
}

model User {
  id              String            @id @default(cuid())
  email           String            @unique
  name            String?
  password        String
  token           String?
  profileImg      String?           @db.VarChar(2048)
  number          String?
  freeDownloads   Int               @default(3)
  downloadHistory DownloadHistory[]
  role            Role              @default(USER)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  templates       Template[]        @relation("UserTemplates")
}

model Otp {
  id        String   @id @default(cuid())
  code      String
  expiresAt DateTime
  email     String   @unique // Ensure this is unique
}

model Template {
  id          String   @id @default(cuid())
  title       String
  price       Float    @default(0)
  description String?  @db.Text // Optional description of the template
  imageUrl    String? // URL for the template image
  version     String? // URL for the template image
  userId      String
  downloads   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User?    @relation("UserTemplates", fields: [userId], references: [id])

  // General fields
  industries     IndustryType? @relation(fields: [industryTypeId], references: [id])
  industryTypeId String?

  // Relationships
  templateType   TemplateType? @relation(fields: [templateTypeId], references: [id])
  templateTypeId String?

  subCategory   SubCategory? @relation(fields: [subCategoryId], references: [id])
  subCategoryId String?

  // cmsType   CmsType? @relation(fields: [cmsTypeId], references: [id])
  // cmsTypeId String?

  // UI Template fields
  softwareType   SoftwareType? @relation(fields: [softwareTypeId], references: [id])
  softwareTypeId String?

  // CMS Website fields
  mobileVersion      Boolean? // Indicates whether the CMS template has a mobile version
  documentationReady Boolean? // Indicates if documentation is ready for the CMS website

  credits     Credit[] // Relation to Credits (for fonts, icons, etc.)
  techDetails Json? // Change to an array of strings for tech details

  // These are required and stored as arrays
  sourceFiles         SourceFile[] // Required array of source files for the template
  sliderImages        SliderImage[] // Required array of slider images for showcasing the template
  previewImages       PreviewImage[] // Required array of preview images for the template
  previewMobileImages PreviewMobileImage[] // Required array of preview images for the template

  seoTags         Json // SEO tags for the template
  isPaid          Boolean           @default(false) // Whether the template is free or paid
  downloadHistory DownloadHistory[]

  @@index([userId], map: "Template_userId_fkey") // Index for efficient user-template querying
}

model Credit {
  id            String   @id @default(cuid())
  fonts         Json?
  images        Json?
  icons         Json?
  illustrations Json?
  template      Template @relation(fields: [templateId], references: [id])
  templateId    String
}

model TechnicalDetail {
  id         String @id @default(cuid())
  techName   String // Changed to a single string
  // template   Template @relation(fields: [templateId], references: [id])
  templateId String
}

// Assets Model for required arrays
model SourceFile {
  id         String   @id @default(cuid())
  fileUrl    String   @db.Text
  template   Template @relation(fields: [templateId], references: [id])
  templateId String
}

model SliderImage {
  id         String   @id @default(cuid())
  imageUrl   String   @db.Text
  template   Template @relation(fields: [templateId], references: [id])
  templateId String
}

model PreviewImage {
  id         String   @id @default(cuid())
  imageUrl   String   @db.Text
  template   Template @relation(fields: [templateId], references: [id])
  templateId String
}

model PreviewMobileImage {
  id         String   @id @default(cuid())
  imageUrl   String   @db.Text
  template   Template @relation(fields: [templateId], references: [id])
  templateId String
}

model TemplateType {
  id            String         @id @default(cuid())
  name          String         @unique
  templates     Template[]
  subCategories SubCategory[]  @relation("TemplateTypeSubCategories") // One-to-many relationship
  softwareType  SoftwareType[] @relation("TemplateTypeSoftwareTypes") // One-to-many relationship
}

model SubCategory {
  id             String        @id @default(cuid())
  name           String        @unique
  templates      Template[]
  templateType   TemplateType? @relation("TemplateTypeSubCategories", fields: [templateTypeId], references: [id])
  templateTypeId String?
}

// model CmsType {
//   id        String     @id @default(cuid())
//   name      String     @unique
//   templates Template[]
// }

model SoftwareType {
  id             String        @id @default(cuid())
  name           String        @unique
  templates      Template[] // Relationship to Template
  templateType   TemplateType? @relation("TemplateTypeSoftwareTypes", fields: [templateTypeId], references: [id])
  templateTypeId String? // Optional relation to TemplateType
}

model IndustryType {
  id        String     @id @default(cuid())
  name      String     @unique
  templates Template[]
}

model DownloadHistory {
  id           String   @id @default(cuid())
  userId       String?
  email        String
  templateId   String
  downloadedAt DateTime @default(now()) // Timestamp of the download

  user     User?    @relation(fields: [userId], references: [id])
  template Template @relation(fields: [templateId], references: [id])

  @@index([userId, templateId], map: "DownloadHistory_userId_templateId_idx") // Index for efficient querying
}
