import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/httpError";

type ProductSpecInput = {
  label: string;
  value: string;
};

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
  slug?: string;
  rating?: number;
  images?: string[];
  specs?: ProductSpecInput[];
};

const MAX_IMAGES = 12;
const MAX_IMAGE_URL_LENGTH = 2048;
const MAX_SPEC_ITEMS = 30;
const MAX_SPEC_LABEL_LENGTH = 100;
const MAX_SPEC_VALUE_LENGTH = 500;

const isImageSource = (value: string) => /^(https?:\/\/|\/)/i.test(value);

const ensureNonEmptyString = (value: unknown, field: string, maxLength = 300) => {
  if (typeof value !== "string") {
    throw new HttpError(400, `${field} must be a string`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new HttpError(400, `${field} is required`);
  }

  if (normalized.length > maxLength) {
    throw new HttpError(400, `${field} is too long`);
  }

  return normalized;
};

const ensureNumberInRange = (
  value: unknown,
  field: string,
  min: number,
  max: number,
  allowFloat = true,
) => {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    throw new HttpError(400, `${field} must be a valid number`);
  }

  if (!allowFloat && !Number.isInteger(value)) {
    throw new HttpError(400, `${field} must be an integer`);
  }

  if (value < min || value > max) {
    throw new HttpError(400, `${field} must be between ${min} and ${max}`);
  }

  return value;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";

const normalizeImages = (imageUrl?: string, images?: string[]) => {
  const values = [imageUrl, ...(images ?? [])]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(new Set(values));
};

const validateImages = (images: string[]) => {
  if (images.length > MAX_IMAGES) {
    throw new HttpError(400, `images cannot exceed ${MAX_IMAGES} entries`);
  }

  for (const image of images) {
    if (image.length > MAX_IMAGE_URL_LENGTH) {
      throw new HttpError(400, "image URL is too long");
    }

    if (!isImageSource(image)) {
      throw new HttpError(400, "image must start with '/' or 'http(s)://' ");
    }
  }
};

const normalizeSpecs = (specs?: ProductSpecInput[]) => {
  if (!specs) return [];

  const normalized = specs
    .map((spec) => ({
      label: String(spec.label ?? "").trim(),
      value: String(spec.value ?? "").trim(),
    }))
    .filter((spec) => spec.label.length > 0 && spec.value.length > 0);

  if (normalized.length > MAX_SPEC_ITEMS) {
    throw new HttpError(400, `specs cannot exceed ${MAX_SPEC_ITEMS} entries`);
  }

  for (const spec of normalized) {
    if (spec.label.length > MAX_SPEC_LABEL_LENGTH) {
      throw new HttpError(400, "spec label is too long");
    }

    if (spec.value.length > MAX_SPEC_VALUE_LENGTH) {
      throw new HttpError(400, "spec value is too long");
    }
  }

  return normalized;
};

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base);
  let slug = root;
  let suffix = 2;

  while (
    await prisma.product.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    })
  ) {
    slug = `${root}-${suffix++}`;
  }

  return slug;
}

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
    const name = ensureNonEmptyString(data.name, "name", 200);
    const description = ensureNonEmptyString(data.description, "description", 5000);
    const category = ensureNonEmptyString(data.category, "category", 120);
    const price = ensureNumberInRange(data.price, "price", 0, 1_000_000_000);
    const stock = ensureNumberInRange(data.stock, "stock", 0, 10_000_000, false);
    const rating =
      data.rating === undefined
        ? 0
        : ensureNumberInRange(data.rating, "rating", 0, 5);

    if (data.imageUrl !== undefined && data.imageUrl !== null) {
      const imageUrl = data.imageUrl.trim();
      if (imageUrl && !isImageSource(imageUrl)) {
        throw new HttpError(400, "imageUrl must start with '/' or 'http(s)://' ");
      }
    }

    const slug = await uniqueSlug(data.slug ?? name);
    const images = normalizeImages(data.imageUrl, data.images);
    validateImages(images);
    const specs = normalizeSpecs(data.specs);

    return prisma.product.create({
      data: {
        name,
        description,
        price,
        category,
        stock,
        imageUrl: data.imageUrl ?? images[0] ?? null,
        rating,
        slug,
        images,
        specs,
      },
    });
  }

  static async update(id: string, data: Partial<ProductInput>) {
    const existing = await this.getById(id);

    if (data.name !== undefined) {
      ensureNonEmptyString(data.name, "name", 200);
    }

    if (data.description !== undefined) {
      ensureNonEmptyString(data.description, "description", 5000);
    }

    if (data.category !== undefined) {
      ensureNonEmptyString(data.category, "category", 120);
    }

    if (data.price !== undefined) {
      ensureNumberInRange(data.price, "price", 0, 1_000_000_000);
    }

    if (data.stock !== undefined) {
      ensureNumberInRange(data.stock, "stock", 0, 10_000_000, false);
    }

    if (data.rating !== undefined) {
      ensureNumberInRange(data.rating, "rating", 0, 5);
    }

    if (data.imageUrl !== undefined && data.imageUrl !== null) {
      const imageUrl = data.imageUrl.trim();
      if (imageUrl && !isImageSource(imageUrl)) {
        throw new HttpError(400, "imageUrl must start with '/' or 'http(s)://' ");
      }
    }

    if (data.slug !== undefined) {
      const normalized = data.slug.trim();
      if (!normalized) {
        throw new HttpError(400, "slug cannot be empty");
      }
    }

    const images = data.images ? normalizeImages(data.imageUrl, data.images) : undefined;
    if (images !== undefined) {
      validateImages(images);
    }
    const specs = data.specs ? normalizeSpecs(data.specs) : undefined;
    const slug = data.slug ?? (data.name ? await uniqueSlug(data.name, id) : existing.slug);

    return prisma.product.update({
      where: { id },
      data: {
        ...data,
        ...(data.name ? { slug } : {}),
        ...(data.slug ? { slug } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
        ...(images !== undefined ? { images } : {}),
        ...(specs !== undefined ? { specs } : {}),
        ...(data.rating !== undefined ? { rating: data.rating } : {}),
      }
    });
  }

  static async remove(id: string) {
    await this.getById(id);
    await prisma.product.delete({ where: { id } });
    return { message: "Product deleted successfully" };
  }
}
