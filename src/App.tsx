import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useLocation, useSearchParams, data } from 'react-router-dom'
import BingoCard from './components/BingoCard'
import ShareModal from './components/ShareModal'
import ErrorBoundary from './components/ErrorBoundary'
import ErrorMessage from './components/ErrorMessage'
import LoadingSpinner from './components/LoadingSpinner'
import Layout from './components/Layout'
import MainContent from './components/MainContent'
import { ControlsSidebar } from './components/ControlsSidebar'
import { ThemeProvider } from './contexts/ThemeContext'
import { CardProvider } from './contexts/CardContext'
import { DabberColorProvider } from './contexts/DabberColorContext'
import { getCardDataFromUrl } from './utils/urlEncoder'
import { useErrorHandler } from './hooks/useErrorHandler'
import { useCardState } from './hooks/useCardState'
import { AppErrorHandler } from './utils/errorHandler'
import { createTechAllHandsCard } from './data/sampleCards'
import type { CardData } from './types'
import './App.css'



// Main application component with unified interface
const MainApp = React.memo(() => {
  const [showShareModal, setShowShareModal] = useState(false)
  const [showVariants, setShowVariants] = useState(false)
  const [variantCount, setVariantCount] = useState(1)
  const [isPlayMode, setIsPlayMode] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Use the centralized card state hook
  const {
    cardData,
    createCard,
    randomizeCard
  } = useCardState()

  const {
    error,
    isLoading,
    clearError,
    executeWithErrorHandling
  } = useErrorHandler()

  // Define all handlers at the top level before any conditional returns
  const handleCreateNew = useCallback(() => {
    setIsPlayMode(false)
    setShowVariants(false)
    setShowShareModal(false)
    clearError()
    navigate('/')
  }, [navigate, clearError])

  const handleSquareClick = useCallback((index: number) => {
    // Handle square click logic for play mode
    console.log('Square clicked:', index)
  }, [])

  const handleCardCreate = useCallback((data: Omit<CardData, 'id' | 'createdAt' | 'updatedAt'>) => {
    createCard(data)
  }, [createCard])

  const handleShare = useCallback(() => {
    setShowShareModal(true)
  }, [])

  const handleRandomizeCard = useCallback(() => {
    randomizeCard()
  }, [randomizeCard])

  const handleRemixCard = useCallback(() => {
    if (cardData) {
      navigate('/', { 
        state: { 
          remixData: {
            title: cardData.title,
            terms: cardData.terms,
            freeSpaceIcon: cardData.freeSpaceIcon,
            freeSpaceImage: cardData.freeSpaceImage
          }
        }
      })
    }
  }, [cardData, navigate])

  const handleVariantCountChange = useCallback((count: number) => {
    setVariantCount(count)
  }, [])

  // Memoize sidebar to prevent unnecessary re-renders
  const sidebar = useMemo(() => (
    <ControlsSidebar
      cardData={cardData}
      onCardDataChange={(data) => createCard(data)}
      onCardCreate={handleCardCreate}
      showVariants={showVariants}
      onToggleVariants={() => setShowVariants(!showVariants)}
      onShare={handleShare}
      onRandomizeCard={handleRandomizeCard}
      onRemixCard={handleRemixCard}
      container={cardRef.current || document}
      variantCount={variantCount}
      onVariantCountChange={handleVariantCountChange}
    />
  ), [cardData, createCard, handleCardCreate, showVariants, handleShare, handleRandomizeCard, handleRemixCard, variantCount, handleVariantCountChange])
  // Initialize app on mount
  useEffect(() => {
    const playParam = searchParams.get('play')
    const dataParam = searchParams.get('data')
    
    if (playParam === 'true' && dataParam) {
      // Play mode with shared card data
      setIsPlayMode(true)
      executeWithErrorHandling(
        async () => {
          const sharedCardData = getCardDataFromUrl()
          if (sharedCardData) {
            createCard(sharedCardData)
            return sharedCardData
          } else {
            throw AppErrorHandler.createError(
              'URL_PARSING_ERROR',
              'No card data found in URL',
              'The shared link does not contain valid card data. Please check the URL or request a new share link.',
              false
            )
          }
        },
        AppErrorHandler.handleURLError
      )
    } else {
      // Creator mode - load default card
      setIsPlayMode(false)
      let cardData = createTechAllHandsCard()
      
      try {
        if (dataParam) {
          cardData = getCardDataFromUrl()
        }
      } catch (e) {
        console.error('Error parsing card data from URL:', e)
      } 

      createCard(cardData)
    }

  }, [searchParams, createCard, executeWithErrorHandling]) // Include all dependencies

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      // Update state based on current URL parameters
      const currentParams = new URLSearchParams(window.location.hash.split('?')[1] || '')
      const playParam = currentParams.get('play')
      
      if (playParam !== 'true') {
        // Navigated back to creator mode
        setIsPlayMode(false)
        setShowVariants(false)
        setShowShareModal(false)
        clearError()
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [clearError])

  // Handle remix data from navigation state
  useEffect(() => {
    const remixData = (location.state as { remixData?: Partial<CardData> })?.remixData;
    if (remixData && !isPlayMode) {
      createCard({
        title: remixData.title || '',
        terms: remixData.terms || [],
        freeSpaceIcon: remixData.freeSpaceIcon || 'star',
        freeSpaceImage: remixData.freeSpaceImage
      });
    }
  }, [location.state, createCard, isPlayMode]);

  // Render different UI based on mode and state
  const renderContent = () => {
    // Handle error state for play mode
    if (isPlayMode && error) {
      return (
        <Layout isPlayMode={isPlayMode}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100%',
            padding: '2rem'
          }}>
            <div style={{ maxWidth: '600px', width: '100%' }}>
              <ErrorMessage
                error={error}
                onDismiss={clearError}
                showDetails={true}
              />
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button
                  onClick={handleCreateNew}
                  style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Create New Card
                </button>
              </div>
            </div>
          </div>
        </Layout>
      )
    }

    // Handle loading state for play mode
    if (isPlayMode && (isLoading || !cardData)) {
      return (
        <Layout isPlayMode={isPlayMode}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100%'
          }}>
            <LoadingSpinner
              size="large"
              message="Loading shared card..."
            />
          </div>
        </Layout>
      )
    }

    // Play mode interface
    if (isPlayMode && cardData) {
      return (
        <Layout isPlayMode={isPlayMode} onCreateNew={handleCreateNew}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '100%',
            padding: '2rem'
          }}>
            {/* <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem',
                flexWrap: 'wrap'
              }}>
                <h2 style={{ margin: 0, color: '#495057' }}>
                  Playing: {cardData.title}
                </h2>
              </div>
              <p style={{ color: '#6c757d', fontSize: '0.875rem', margin: 0 }}>
                Click squares to mark them as you hear the buzzwords!
              </p>
            </div> */}

            <BingoCard
              title={cardData.title}
              terms={cardData.terms}
              freeSpaceImage={cardData.freeSpaceImage}
              freeSpaceIcon={cardData.freeSpaceIcon}
              isPlayMode={true}
              onSquareClick={handleSquareClick}
              arrangement={cardData.arrangement}
            />
          </div>
        </Layout>
      )
    }

    // Creator mode interface
    return (
      <Layout
        showSidebar={true}
        sidebar={sidebar}
        onRemixCard={handleRemixCard}
        showRemixButton={!!cardData}
        isPlayMode={false}
      >
        <div ref={cardRef}>
          <MainContent
            cardData={cardData}
            showVariants={showVariants}
            variantCount={variantCount}
            onSquareClick={handleSquareClick}
          />
        </div>

        {cardData && (
          <ShareModal
            cardData={cardData}
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </Layout>
    )
  }

  return renderContent()
});

MainApp.displayName = 'MainApp';

// Main App component with simplified routing
const App = React.memo(() => {
  return (
    <ThemeProvider>
      <DabberColorProvider>
        <CardProvider>
          <ErrorBoundary>
            <MainApp />
          </ErrorBoundary>
        </CardProvider>
      </DabberColorProvider>
    </ThemeProvider>
  )
});

App.displayName = 'App';

export default App
