import { IndiaThreatMap } from './IndiaThreatMap.js'
import { useTranslation } from '../i18n/index.js'

export function RadarMapScreen({
  onSelectCorridor,
}: {
  onSelectCorridor?: (pin: string) => void
} = {}) {
  const { t } = useTranslation()

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in">
      <IndiaThreatMap />
    </div>
  )
}
