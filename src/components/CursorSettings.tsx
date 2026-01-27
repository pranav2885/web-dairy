import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { type CursorStyle, type CursorSize, type CursorTheme } from './CustomCursor';

interface CursorSettingsProps {
  cursorStyle: CursorStyle;
  cursorSize: CursorSize;
  cursorTheme: CursorTheme;
  speedSensitivity: number;
  enabled: boolean;
  onStyleChange: (style: CursorStyle) => void;
  onSizeChange: (size: CursorSize) => void;
  onThemeChange: (theme: CursorTheme) => void;
  onSpeedChange: (speed: number) => void;
  onEnabledChange: (enabled: boolean) => void;
}

export function CursorSettings({
  cursorStyle,
  cursorSize,
  cursorTheme,
  speedSensitivity,
  enabled,
  onStyleChange,
  onSizeChange,
  onThemeChange,
  onSpeedChange,
  onEnabledChange,
}: CursorSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cursor Customization</CardTitle>
        <CardDescription>
          Personalize your cursor appearance and behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Custom Cursor</Label>
            <p className="text-sm text-muted-foreground">
              Enable or disable custom cursor effects
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>

        <Separator />

        {/* Cursor Style */}
        <div className="space-y-2">
          <Label>Animation Style</Label>
          <Select value={cursorStyle} onValueChange={(value) => onStyleChange(value as CursorStyle)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default - No animation</SelectItem>
              <SelectItem value="smooth">Smooth - Gentle transitions</SelectItem>
              <SelectItem value="elastic">Elastic - Stretches with movement</SelectItem>
              <SelectItem value="bouncy">Bouncy - Spring-like behavior</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {cursorStyle === 'default' && 'Simple cursor with no special effects'}
            {cursorStyle === 'smooth' && 'Smooth following with gentle easing'}
            {cursorStyle === 'elastic' && 'Stretches and rotates based on movement speed'}
            {cursorStyle === 'bouncy' && 'Playful bouncing motion with spring physics'}
          </p>
        </div>

        {/* Cursor Size */}
        <div className="space-y-2">
          <Label>Cursor Size</Label>
          <Select value={cursorSize} onValueChange={(value) => onSizeChange(value as CursorSize)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small - Minimal and precise</SelectItem>
              <SelectItem value="medium">Medium - Balanced visibility</SelectItem>
              <SelectItem value="large">Large - Maximum visibility</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cursor Theme */}
        <div className="space-y-2">
          <Label>Color Theme</Label>
          <Select value={cursorTheme} onValueChange={(value) => onThemeChange(value as CursorTheme)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light - Black (for light backgrounds)</SelectItem>
              <SelectItem value="dark">Dark - White (for dark backgrounds)</SelectItem>
              <SelectItem value="primary">Primary - Indigo (visible in both)</SelectItem>
              <SelectItem value="gradient">Gradient - Purple to Indigo</SelectItem>
              <SelectItem value="auto">Auto - Indigo (recommended)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Speed Sensitivity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Speed Sensitivity</Label>
            <span className="text-sm text-muted-foreground">{speedSensitivity}</span>
          </div>
          <Slider
            value={[speedSensitivity]}
            onValueChange={(value) => onSpeedChange(value[0])}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            How much the cursor reacts to fast movements (1 = subtle, 10 = dramatic)
          </p>
        </div>

        <Separator />

        {/* Hover Behavior Info */}
        <div className="space-y-2">
          <Label>Hover Behavior</Label>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>The cursor expands when hovering over clickable elements like buttons and links, providing visual feedback for interactive areas.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
