import { menuRepository } from "../repositories/menuRepository";

type PrepStation = "KITCHEN" | "BAR";

type CreateMenuInput = {
  name: string;
  price: number;
  categoryId?: number | null;
  prepStation?: PrepStation;
  isAvailable?: boolean;
};

type UpdateMenuInput = {
  id: number;
  name?: string;
  price?: number;
  categoryId?: number | null;
  prepStation?: PrepStation;
  isAvailable?: boolean;
};

export class MenuService {
  async getAllMenus() {
    return menuRepository.findAll();
  }

  async getMenuById(id: number) {
    const menu = await menuRepository.findById(id);

    if (!menu) {
      return {
        kind: "NOT_FOUND" as const,
      };
    }

    return {
      kind: "SUCCESS" as const,
      menu,
    };
  }

  async createMenu(input: CreateMenuInput) {
    if (!input.name?.trim() || input.price === undefined || input.price === null) {
      return {
        kind: "VALIDATION_ERROR" as const,
        message: "Nama dan harga menu wajib diisi.",
      };
    }

    if (Number(input.price) < 0) {
      return {
        kind: "VALIDATION_ERROR" as const,
        message: "Harga menu tidak boleh negatif.",
      };
    }

    if (input.categoryId !== undefined && input.categoryId !== null) {
      const category = await menuRepository.findCategoryById(
        Number(input.categoryId)
      );

      if (!category) {
        return {
          kind: "CATEGORY_NOT_FOUND" as const,
        };
      }
    }

    const menu = await menuRepository.create({
      name: input.name.trim(),
      price: Number(input.price),
      categoryId: input.categoryId ?? null,
      prepStation: input.prepStation ?? "KITCHEN",
      isAvailable: input.isAvailable ?? true,
    });

    return {
      kind: "SUCCESS" as const,
      menu,
    };
  }

  async updateMenu(input: UpdateMenuInput) {
    if (!Number.isFinite(input.id)) {
      return {
        kind: "INVALID_ID" as const,
      };
    }

    if (input.name !== undefined && !input.name.trim()) {
      return {
        kind: "VALIDATION_ERROR" as const,
        message: "Nama menu tidak boleh kosong.",
      };
    }

    if (input.price !== undefined && Number(input.price) < 0) {
      return {
        kind: "VALIDATION_ERROR" as const,
        message: "Harga menu tidak boleh negatif.",
      };
    }

    if (input.isAvailable !== undefined && typeof input.isAvailable !== "boolean") {
      return {
        kind: "VALIDATION_ERROR" as const,
        message: "Status ketersediaan menu harus boolean.",
      };
    }

    if (input.categoryId !== undefined && input.categoryId !== null) {
      const category = await menuRepository.findCategoryById(
        Number(input.categoryId)
      );

      if (!category) {
        return {
          kind: "CATEGORY_NOT_FOUND" as const,
        };
      }
    }

    try {
      const menu = await menuRepository.update(input.id, {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.price !== undefined && { price: Number(input.price) }),
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        ...(input.prepStation !== undefined && {
          prepStation: input.prepStation,
        }),
        ...(input.isAvailable !== undefined && {
          isAvailable: input.isAvailable,
        }),
      });

      return {
        kind: "SUCCESS" as const,
        menu,
      };
    } catch {
      return {
        kind: "NOT_FOUND" as const,
      };
    }
  }

  async deleteMenu(id: number) {
    if (!Number.isFinite(id)) {
      return {
        kind: "INVALID_ID" as const,
      };
    }

    try {
      await menuRepository.delete(id);

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

export const menuService = new MenuService();