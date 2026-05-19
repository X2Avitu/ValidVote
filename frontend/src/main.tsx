import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider, http } from 'wagmi'
import { hardhat, sepolia, mainnet } from 'wagmi/chains'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

const config = getDefaultConfig({
  appName: 'ValidVote',
  projectId: 'a38bb0f1c42fa60548171f2490006c80', // Placeholder project ID for dev
  chains: [hardhat, sepolia, mainnet],
  transports: {
    [hardhat.id]: http('http://127.0.0.1:8545'),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: false,
})

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#d97706', // Gold/Amber accent
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
        >
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
