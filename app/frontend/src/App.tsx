import { useState } from 'react'
import { I18nProvider } from './i18n/index.js'
import { MainShell } from './components/MainShell.js'
import { HomeDashboard } from './components/HomeDashboard.js'
import { LookupScreen } from './components/LookupScreen.js'
import { AIScamScanner } from './components/AIScamScanner.js'
import { RadarMapScreen } from './components/RadarMapScreen.js'
import { AlertsScreen } from './components/AlertsScreen.js'
import { ReportFlow } from './components/ReportFlow.js'
import type { PageId } from './components/Navigation.js'
import type { IdentifierType } from './validation/schemas.js'

function SamanvayaApp() {
  const [page, setPage] = useState<PageId>('home')
  const [lookupType, setLookupType] = useState<IdentifierType>('phone')
  const [lookupValue, setLookupValue] = useState<string>('')
  const [reportCategory, setReportCategory] = useState<string>('digital_arrest')
  const [alertsPincode, setAlertsPincode] = useState<string>('all')

  const handleGlobalSearch = (type: string, value: string) => {
    setLookupType(type as IdentifierType)
    setLookupValue(value)
    setPage('lookup')
  }

  const handleAIScanLookup = (type: string, value: string) => {
    setLookupType(type as IdentifierType)
    setLookupValue(value)
    setPage('lookup')
  }

  const handleAIScanReport = (type: string, value: string, category: string) => {
    setLookupType(type as IdentifierType)
    setLookupValue(value)
    setReportCategory(category)
    setPage('report')
  }

  const handleViewAlerts = (pin?: string) => {
    if (pin) setAlertsPincode(pin)
    setPage('alerts')
  }

  return (
    <MainShell current={page} onSelect={setPage}>
      {page === 'home' && (
        <HomeDashboard
          onSearch={handleGlobalSearch}
          onNavigate={(p: string) => setPage(p as PageId)}
        />
      )}

      {page === 'lookup' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <LookupScreen
            initialType={lookupType}
            initialValue={lookupValue}
            onDisputeTrigger={() => setPage('alerts')}
            onReportTrigger={(t, v) => handleAIScanReport(t, v, 'other')}
          />
        </div>
      )}

      {page === 'scan' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <AIScamScanner
            onLookupIdentifier={handleAIScanLookup}
            onReportIdentifier={handleAIScanReport}
          />
        </div>
      )}

      {page === 'radar' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <RadarMapScreen
            onSelectCorridor={(pin: string) => {
              setLookupType('phone')
              setLookupValue(pin)
              setPage('lookup')
            }}
          />
        </div>
      )}

      {page === 'alerts' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <AlertsScreen
            initialPincode={alertsPincode}
            onLookupIdentifier={handleAIScanLookup}
          />
        </div>
      )}

      {page === 'report' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <ReportFlow
            initialType={lookupType}
            initialValue={lookupValue}
            initialCategory={reportCategory}
            onDone={() => {
              setLookupValue('')
              setPage('home')
            }}
            onViewLookup={handleAIScanLookup}
            onViewAlerts={handleViewAlerts}
            onResetInitial={() => setLookupValue('')}
          />
        </div>
      )}
    </MainShell>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <SamanvayaApp />
    </I18nProvider>
  )
}
