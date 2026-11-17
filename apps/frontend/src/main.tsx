import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { ThemeProvider } from 'next-themes'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@monorepo/ui/globals.css'
import { locale } from '@/features/core/i18n'
import { queryClient } from '@/features/core/query-client'
import { router } from '@/router'

document.documentElement.lang = locale

const root = document.getElementById('root')

if (root === null) throw new Error('index.html has no #root element')

createRoot(root).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
