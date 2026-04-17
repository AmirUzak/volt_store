import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/httpError";

type ProductFilters = {
  category?: string;
  search?: string;
  sort?: string;
};

type ProductInput = {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
};

export class ProductsService {
  static async getAll(filters: ProductFilters) {
    const { category, search, sort } = filters;

    const where = {
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } }
            ]
          }
        : {})
    };

    let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" };
    if (sort === "price_asc") {
      orderBy = { price: "asc" };
    } else if (sort === "price_desc") {
      orderBy = { price: "desc" };
    } else if (sort === "newest") {
      orderBy = { createdAt: "desc" };
    }

    return prisma.product.findMany({ where, orderBy });
  }

  static async getById(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new HttpError(404, "Product not found");
    }
    return product;
  }

  static async create(data: ProductInput) {
    if (!data.name || !data.description || !data.category) {
      throw new HttpError(400, "name, description and category are required");
    }

    if (data.price < 0 || data.stock < 0) {
      throw new HttpError(400, "price and stock cannot be negative");
    }

    return prisma.product.create({ data });
  }

  static async update(id: string, data: Partial<ProductInput>) {
    await this.getById(id);

    if (data.price !== undefined && data.price < 0) {
      throw new HttpError(400, "price cannot be negative");
    }

    if (data.stock !== undefined && data.stock < 0) {
      throw new HttpError(400, "stock cannot be negative");
    }

    return prisma.product.update({
      where: { id },
      data
    });
  }

  static async remove(id: string) {
    await this.getById(id);
    await prisma.product.delete({ where: { id } });
    return { message: "Product deleted successfully" };
  }
}
