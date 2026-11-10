import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { CalendarDays, Clock } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { colors } from '@/constants/theme';
import {
  applyLimaPickerDate,
  applyLimaPickerTime,
  formatLimaDateInput,
  formatLimaTimeInput,
  limaPickerDate,
} from '@/lib/format';

type PickerMode = 'date' | 'time';

type DateTimeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
};

type SelectButtonProps = {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  onPress: () => void;
};

function SelectButton({ icon: Icon, label, value, onPress }: SelectButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="flex-row items-center flex-1 gap-3 px-3 py-3 border rounded-xl border-border bg-surface active:bg-surface-muted">
      <View className="items-center justify-center w-9 h-9 rounded-full bg-surface-muted">
        <Icon color={colors['brand-strong']} size={18} />
      </View>
      <View className="flex-1">
        <AppText className="text-label text-ink-muted">{label}</AppText>
        <AppText className="font-semibold text-body text-ink">{value}</AppText>
      </View>
    </Pressable>
  );
}

export function DateTimeSelect({
  value,
  onChange,
  error,
  required = false,
}: DateTimeSelectProps) {
  const [mode, setMode] = useState<PickerMode | null>(null);

  const pickerDate = limaPickerDate(value);
  const dateLabel = formatLimaDateInput(value) || 'Seleccionar fecha';
  const timeLabel = formatLimaTimeInput(value) || 'Seleccionar hora';

  const handleChange = (event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === 'android') {
      setMode(null);
    }

    if (event.type !== 'set' || !picked || !mode) {
      return;
    }

    onChange(
      mode === 'date'
        ? applyLimaPickerDate(value, picked)
        : applyLimaPickerTime(value, picked),
    );
  };

  return (
    <View>
      <AppText className="mb-2 text-label font-semibold text-ink">
        Fecha y hora
        {required ? <AppText className="text-danger"> *</AppText> : null}
      </AppText>

      <View className="flex-row gap-3">
        <SelectButton
          icon={CalendarDays}
          label="Fecha"
          value={dateLabel}
          onPress={() => setMode('date')}
        />
        <SelectButton
          icon={Clock}
          label="Hora"
          value={timeLabel}
          onPress={() => setMode('time')}
        />
      </View>

      {error ? (
        <AppText
          accessibilityLiveRegion="polite"
          className="mt-2 text-label text-danger">
          {error}
        </AppText>
      ) : (
        <AppText className="mt-2 text-label text-ink-muted">
          Hora de Lima (GMT-5). Al elegir una parte se completa la otra.
        </AppText>
      )}

      {mode && Platform.OS === 'android' ? (
        <DateTimePicker
          value={pickerDate}
          mode={mode}
          display="default"
          is24Hour
          onChange={handleChange}
        />
      ) : null}

      {Platform.OS !== 'android' ? (
        <ModalSheet
          visible={mode !== null}
          title={mode === 'date' ? 'Elegir fecha' : 'Elegir hora'}
          onClose={() => setMode(null)}
          footer={
            <PrimaryButton label="Listo" onPress={() => setMode(null)} />
          }>
          {mode ? (
            <DateTimePicker
              value={pickerDate}
              mode={mode}
              display="spinner"
              is24Hour
              locale="es-PE"
              onChange={handleChange}
            />
          ) : null}
        </ModalSheet>
      ) : null}
    </View>
  );
}
