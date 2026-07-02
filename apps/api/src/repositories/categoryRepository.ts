import { prisma } from "../prisma";

export class CategoryRepository {
  findAll() {
    return prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  findBySlug(slug: string) {
    return prisma.category.findUnique({
      where: { slug },
    });
  }

  countMenusByCategoryId(categoryId: number) {
    return prisma.menu.count({
      where: { categoryId },
    });
  }

  create(data: {
    name: string;
    slug: string;
    sortOrder: number;
    isActive: boolean;
  }) {
    return prisma.category.create({
      data,
    });
  }

  update(
    id: number,
    data: {
      name?: string;
      slug?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ) {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  delete(id: number) {
    return prisma.category.delete({
      where: { id },
    });
  }
}

export const categoryRepository = new CategoryRepository();