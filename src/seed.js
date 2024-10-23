// seed.js

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';


const prisma = new PrismaClient();

async function main() {
  // Create IndustryType entries if they do not exist
  const industries = await Promise.all(
    ["Technology", "Health Care", "Fintech"].map(async (name) => {
      return await prisma.industryType.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    })
  );

  // Example template creation
  const newTemplate = await prisma.template.create({
    data: {
      title: faker.commerce.productName(),
      price: parseFloat(faker.commerce.price()),
      description: faker.lorem.paragraph(),
      imageUrl: faker.image.url(),
      userId: "your-user-id", // replace with your actual user ID
      downloads: faker.number.int({ min: 0, max: 100 }),
      industries: {
        connect: industries, // Connect existing industries
      },
      templateType: {
        create: {
          name: faker.commerce.productMaterial(),
        },
      },
      subCategory: {
        create: {
          name: faker.commerce.productAdjective(),
        },
      },
      softwareType: {
        create: {
          name: faker.commerce.product(),
        },
      },
      sourceFiles: {
        create: [
          {
            fileUrl: faker.system.filePath(),
          },
        ],
      },
      sliderImages: {
        create: [
          {
            imageUrl: faker.image.url(),
          },
        ],
      },
      previewImages: {
        create: [
          {
            imageUrl: faker.image.url(),
          },
        ],
      },
      previewMobileImages: {
        create: [
          {
            imageUrl: faker.image.url(),
          },
        ],
      },
      seoTags: JSON.stringify([faker.lorem.word(), faker.lorem.word()]),
      isPaid: faker.datatype.boolean(),
    },
  });

  console.log(newTemplate);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });