import { categoryRepository } from "../repositories/categoryRepository";

type CreateCategoryInput = {
  name: string;
  sortOrder?: number;
  isActive?: boolean;
};

type UpdateCategoryInput = {
  id: number;
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export class CategoryService {
  async getAllCategories() {
    return categoryRepository.findAll();
  }

  async createCategory(input: CreateCategoryInput) {
    if (!input.name?.trim()) {
      return {
        kind: "VALIDATION_ERROR" as const,
        message: "Nama kategori wajib diisi.",
      };
    }

    const slug = slugify(input.name);
    const existing = await categoryRepository.findBySlug(slug);

    if (existing) {
      return {
        kind: "DUPLICATE" as const,
      };
    }

    const category = await categoryRepository.create({
      name: input.name.trim(),
      slug,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
    });

    return {
      kind: "SUCCESS" as const,
      category,
    };
  }

  async updateCategory(input: UpdateCategoryInput) {
    const data: {
      name?: string;
      slug?: string;
      sortOrder?: number;
      isActive?: boolean;
    } = {};

    if (input.name !== undefined) {
      if (!input.name.trim()) {
        return {
          kind: "VALIDATION_ERROR" as const,
          message: "Nama kategori wajib diisi.",
        };
      }

      data.name = input.name.trim();
      data.slug = slugify(input.name);
    }

    if (input.sortOrder !== undefined) {
      data.sortOrder = input.sortOrder;
    }

    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
    }

    try {
      const category = await categoryRepository.update(input.id, data);

      return {
        kind: "SUCCESS" as const,
        category,
      };
    } catch {
      return {
        kind: "NOT_FOUND" as const,
      };
    }
  }

  async deleteCategory(categoryId: number) {
    const usedByMenus = await categoryRepository.countMenusByCategoryId(
      categoryId
    );

    if (usedByMenus > 0) {
      return {
        kind: "USED_BY_MENU" as const,
      };
    }

    try {
      await categoryRepository.delete(categoryId);

      return {
        kind: "SUCCESS" as const,
      };
    } catch {
      return {
        kind: "NOT_FOUND" as const,
      };
    }
  }
}

export const categoryService = new CategoryService();