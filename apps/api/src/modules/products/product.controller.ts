import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import { ProductService } from './product.service.js';

export class ProductController {
  constructor(private readonly service: ProductService) {}

  list = async (request: Request, response: Response) => {
const query: {
      category?: string;
      search?: string;
      franchise?: string;
      inStockOnly?: boolean;
      sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
      page?: number;
      limit?: number;
      minPrice?: number;
      maxPrice?: number;
    } = {
      category: request.query.category as string | undefined,
      search: request.query.search as string | undefined,
      franchise: request.query.franchise as string | undefined,
      inStockOnly: request.query.inStockOnly === 'true' ? true : undefined,
      sort: request.query.sort as 'price_asc' | 'price_desc' | 'rating' | 'newest' | undefined,
      page: request.query.page ? Number(request.query.page) : undefined,
      limit: request.query.limit ? Number(request.query.limit) : undefined,
    };

    if (request.query.minPrice !== undefined) {
      query.minPrice = Number(request.query.minPrice);
    }
    if (request.query.maxPrice !== undefined) {
      query.maxPrice = Number(request.query.maxPrice);
    }

    const result = await this.service.list(query);
    response.json({ data: result });
  };

getBySlug = async (request: Request, response: Response) => {
    const slug = request.params.slug as string;
    const product = await this.service.getBySlug(slug);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    response.json({ data: { product } });
  };

  getCategories = async (_request: Request, response: Response) => {
    const categories = await this.service.getCategories();
    response.json({ data: { categories } });
  };

  getFranchises = async (_request: Request, response: Response) => {
    const franchises = await this.service.getFranchises();
    response.json({ data: { franchises } });
  };

  getFeatured = async (_request: Request, response: Response) => {
    const products = await this.service.getFeatured();
    response.json({ data: { products } });
  };

  getLimitedDrops = async (_request: Request, response: Response) => {
    const products = await this.service.getLimitedDrops();
    response.json({ data: { products } });
  };
}
