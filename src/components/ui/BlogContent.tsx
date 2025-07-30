'use client';

import React from 'react';
import theme from '@/styles/theme';

interface BlogContentProps {
  content: string;
  className?: string;
}

const BlogContent: React.FC<BlogContentProps> = ({ content, className = '' }) => {
  return (
    <>
      <div 
        className={`blog-content ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
      
      <style jsx>{`
      .blog-content {
        line-height: 1.8;
        color: ${theme.colors.textPrimary};
      }
      
      .blog-content h1,
      .blog-content h2,
      .blog-content h3,
      .blog-content h4,
      .blog-content h5,
      .blog-content h6 {
        color: ${theme.colors.textPrimary};
        margin: 2rem 0 1rem 0;
        font-weight: 600;
        line-height: 1.3;
      }
      
      .blog-content h1 {
        font-size: 2.5rem;
        border-bottom: 2px solid ${theme.colors.primary};
        padding-bottom: 0.5rem;
      }
      
      .blog-content h2 {
        font-size: 2rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 0.5rem;
      }
      
      .blog-content h3 {
        font-size: 1.5rem;
      }
      
      .blog-content h4 {
        font-size: 1.25rem;
      }
      
      .blog-content h5 {
        font-size: 1.1rem;
      }
      
      .blog-content h6 {
        font-size: 1rem;
      }
      
      .blog-content p {
        margin: 1rem 0;
        line-height: 1.8;
      }
      
      .blog-content ul,
      .blog-content ol {
        margin: 1rem 0;
        padding-left: 2rem;
      }
      
      .blog-content li {
        margin: 0.5rem 0;
        line-height: 1.6;
      }
      
      .blog-content ul li {
        list-style-type: disc;
      }
      
      .blog-content ol li {
        list-style-type: decimal;
      }
      
      .blog-content a {
        color: ${theme.colors.primary};
        text-decoration: underline;
        transition: color 0.2s ease;
      }
      
      .blog-content a:hover {
        color: ${theme.colors.accent};
      }
      
      .blog-content img {
        max-width: 100%;
        height: auto;
        border-radius: 0.75rem;
        margin: 1.5rem 0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      .blog-content blockquote {
        border-left: 4px solid ${theme.colors.primary};
        margin: 1.5rem 0;
        padding: 1rem 1.5rem;
        background-color: rgba(255, 255, 255, 0.05);
        border-radius: 0 0.5rem 0.5rem 0;
        font-style: italic;
        color: rgba(255, 255, 255, 0.9);
      }
      
      .blog-content blockquote p {
        margin: 0;
      }
      
      .blog-content code {
        background-color: rgba(255, 255, 255, 0.1);
        padding: 0.2rem 0.4rem;
        border-radius: 0.25rem;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
      }
      
      .blog-content pre {
        background-color: rgba(0, 0, 0, 0.3);
        padding: 1rem;
        border-radius: 0.5rem;
        overflow-x: auto;
        margin: 1.5rem 0;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .blog-content pre code {
        background-color: transparent;
        padding: 0;
        color: ${theme.colors.textPrimary};
      }
      
      .blog-content table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
        background-color: rgba(255, 255, 255, 0.05);
        border-radius: 0.5rem;
        overflow: hidden;
      }
      
      .blog-content th,
      .blog-content td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .blog-content th {
        background-color: rgba(255, 255, 255, 0.1);
        font-weight: 600;
        color: ${theme.colors.textPrimary};
      }
      
      .blog-content tr:hover {
        background-color: rgba(255, 255, 255, 0.05);
      }
      
      .blog-content hr {
        border: none;
        height: 1px;
        background-color: rgba(255, 255, 255, 0.2);
        margin: 2rem 0;
      }
      
      .blog-content strong {
        font-weight: 600;
        color: ${theme.colors.textPrimary};
      }
      
      .blog-content em {
        font-style: italic;
        color: rgba(255, 255, 255, 0.9);
      }
      
      .blog-content u {
        text-decoration: underline;
      }
      
      .blog-content s {
        text-decoration: line-through;
        opacity: 0.7;
      }
      
      /* Responsividade */
      @media (max-width: 768px) {
        .blog-content h1 {
          font-size: 2rem;
        }
        
        .blog-content h2 {
          font-size: 1.75rem;
        }
        
        .blog-content h3 {
          font-size: 1.5rem;
        }
        
        .blog-content ul,
        .blog-content ol {
          padding-left: 1.5rem;
        }
        
        .blog-content blockquote {
          padding: 0.75rem 1rem;
                 }
       }
     `}</style>
    </>
  );
 };

export default BlogContent; 