import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/authContext.tsx'
import { ConfirmProvider } from './components/ModalDelete/ConfirmProvider.tsx'
import { RepositoriesProvider } from './repositories/repositoriesContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfirmProvider>
        <AuthProvider>
          <RepositoriesProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1f2937',
                  color: '#fff',
                  border: '1px solid #374151',
                },
              }}
            />
          </RepositoriesProvider>
        </AuthProvider>
    </ConfirmProvider>
  </StrictMode>
)
