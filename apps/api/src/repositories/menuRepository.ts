import { prisma } from "../prisma";

export class MenuRepository {
  findAll() {
    return prisma.menu.findMany({
      include: {
        category: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  findById(id: number) {
    return prisma.menu.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
  }

  findCategoryById(categoryId: number) {
    return prisma.category.findUnique({
      where: { id: categoryId },
    });
  }

  create(data: {
    name: string;
    price: number;
    categoryId?: number | null;
    prepStation: "KITCHEN" | "BAR";
    isAvailable: boolean;
  }) {
    return prisma.menu.create({
      data,
      include: {
        category: true,
      },
    });
  }

  update(
    id: number,
    data: {
      name?: string;
      price?: number;
      categoryId?: number | null;
      prepStation?: "KITCHEN" | "BAR";
      isAvailable?: boolean;
    }
  ) {
    return prisma.menu.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    });
  }

  delete(id: number) {
    return prisma.menu.delete({
      where: { id },
    });
  }
}

export const menuRepository = new MenuRepository();