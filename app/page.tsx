import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import HomeClient from '@/components/HomeClient';
import BlogCard from '@/components/BlogCard';

export default function Home() {
  const allPosts = getAllPosts();
  const recentPosts = allPosts.slice(0, 3); // Mostrar solo los 3 posts más recientes

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      {/* Componente cliente con navbar, hero, features, stats, CTA y footer */}
      <HomeClient />

      {/* Blog Section - Server Side para leer archivos MD */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 -mt-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Blog y Recursos
          </h2>
          <p className="text-xl text-gray-600">
            Aprende más sobre gestión empresarial y optimiza tu negocio
          </p>
        </div>

        {recentPosts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recentPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-md transition-all"
              >
                Ver todos los artículos
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
            <p className="text-gray-600">
              Próximamente: Artículos sobre facturación, inventarios, recursos humanos y más...
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xl font-bold">FalconERP</span>
              </div>
              <p className="text-gray-400">
                Sistema ERP simple y completo para tu negocio
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Enlaces</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/" className="hover:text-white">Inicio</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/login" className="hover:text-white">Iniciar Sesión</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Términos y Condiciones</li>
                <li>Política de Privacidad</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 FalconERP. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
