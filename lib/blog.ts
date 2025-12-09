import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const postsDirectory = path.join(process.cwd(), 'content/blog');

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  author: string;
  image?: string;
  content: string;
  htmlContent?: string;
}

export interface BlogPostMetadata {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  author: string;
  image?: string;
}

/**
 * Obtiene todos los posts del blog ordenados por fecha
 */
export function getAllPosts(): BlogPostMetadata[] {
  try {
    // Verificar si el directorio existe
    if (!fs.existsSync(postsDirectory)) {
      return [];
    }

    const fileNames = fs.readdirSync(postsDirectory);
    const allPostsData = fileNames
      .filter((fileName) => fileName.endsWith('.md'))
      .map((fileName) => {
        const slug = fileName.replace(/\.md$/, '');
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data } = matter(fileContents);

        return {
          slug,
          title: data.title || '',
          description: data.description || '',
          date: data.date || '',
          category: data.category || 'General',
          author: data.author || 'FalconERP Team',
          image: data.image,
        };
      });

    // Ordenar por fecha descendente
    return allPostsData.sort((a, b) => {
      if (a.date < b.date) {
        return 1;
      } else {
        return -1;
      }
    });
  } catch (error) {
    console.error('Error al leer posts del blog:', error);
    return [];
  }
}

/**
 * Obtiene un post específico por su slug
 */
export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    const htmlContent = marked(content);

    return {
      slug,
      title: data.title || '',
      description: data.description || '',
      date: data.date || '',
      category: data.category || 'General',
      author: data.author || 'FalconERP Team',
      image: data.image,
      content,
      htmlContent: htmlContent as string,
    };
  } catch (error) {
    console.error(`Error al leer el post ${slug}:`, error);
    return null;
  }
}

/**
 * Obtiene posts filtrados por categoría
 */
export function getPostsByCategory(category: string): BlogPostMetadata[] {
  const allPosts = getAllPosts();
  return allPosts.filter((post) => post.category === category);
}

/**
 * Obtiene todas las categorías únicas
 */
export function getAllCategories(): string[] {
  const allPosts = getAllPosts();
  const categories = allPosts.map((post) => post.category);
  return Array.from(new Set(categories));
}
