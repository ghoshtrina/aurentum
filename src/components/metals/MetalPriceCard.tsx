import { Card } from '@/components/ui/Card';
import { ChangeIndicator } from '@/components/ui/ChangeIndicator';
import { AutoShrinkText } from '@/components/ui/AutoShrinkText';
import { formatCurrency } from '@/lib/utils/format';

interface MetalPriceCardProps {
  label: string;
  pricePerGram: number;
  change1D?: number;
  isEstimated?: boolean;
}

export function MetalPriceCard({ label, pricePerGram, change1D, isEstimated }: MetalPriceCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="mt-1 text-2xl font-bold tracking-tight">
            <AutoShrinkText>{pricePerGram > 0 ? formatCurrency(pricePerGram) : '--'}</AutoShrinkText>
          </div>
          {change1D !== undefined && (
            <div className="mt-1">
              <ChangeIndicator value={change1D} />
            </div>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">per gram</p>
        </div>
        {isEstimated && pricePerGram > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            Estimated
          </span>
        )}
      </div>
    </Card>
  );
}
