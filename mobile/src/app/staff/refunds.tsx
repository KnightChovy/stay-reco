import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors, radius } from '@/constants/theme';
import { refundRequests, type RefundRequest, type RefundStatus, type Tone } from '@/features/staff/data';
import { Banner, Card, FilterChips, Grid, KV, Sheet, StaffScreen, Stat, accent, s, success } from '@/features/staff/ui';
import { formatVnd } from '@/lib/stay';

type Filter = 'all' | 'pending' | 'approved' | 'rejected';
const filterStatus: Record<Exclude<Filter, 'all'>, RefundStatus> = {
  pending: 'Chờ thẩm định',
  approved: 'Đã duyệt hoàn tiền',
  rejected: 'Từ chối',
};
const statusTone: Record<RefundStatus, Tone> = { 'Chờ thẩm định': 'warning', 'Đã duyệt hoàn tiền': 'tertiary', 'Từ chối': 'danger' };
const scoreTone = (score: number): Tone => (score >= 90 ? 'tertiary' : score >= 60 ? 'warning' : 'danger');

function PercentStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  // Thay cho thanh trượt bên web: bước 5% trong khoảng 0–100.
  return (
    <View style={s.row}>
      <Pressable accessibilityLabel="Giảm 5%" onPress={() => onChange(Math.max(0, value - 5))} style={styles.step}>
        <Icon name="remove" size={18} color={colors.onSurface} />
      </Pressable>
      <Text variant="h2" color={accent} style={styles.percent}>
        {value}%
      </Text>
      <Pressable accessibilityLabel="Tăng 5%" onPress={() => onChange(Math.min(100, value + 5))} style={styles.step}>
        <Icon name="add" size={18} color={colors.onSurface} />
      </Pressable>
    </View>
  );
}

export default function StaffRefundsScreen() {
  const [requests, setRequests] = useState(refundRequests);
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<RefundRequest | null>(null);
  const [percent, setPercent] = useState(80);
  const [note, setNote] = useState('');

  const list = filter === 'all' ? requests : requests.filter((r) => r.status === filterStatus[filter]);
  const pending = requests.filter((r) => r.status === 'Chờ thẩm định');
  const decide = (status: RefundStatus) => {
    if (!selected) return;
    setRequests((prev) => prev.map((r) => (r.id === selected.id ? { ...r, status } : r)));
    setSelected(null);
  };
  const open = (r: RefundRequest) => {
    setSelected(r);
    setPercent(Math.round((r.requestedRefund / r.totalPaid) * 100));
    setNote('');
  };

  return (
    <StaffScreen title="Hoàn tiền & chính sách">
      <Grid>
        <Stat icon="currency_exchange" label="Tổng yêu cầu chờ thẩm định" value={`${pending.length}`} unit="yêu cầu" foot="Cần duyệt" tint={accent} />
        <Stat icon="payments" label="Tổng giá trị đề xuất hoàn" value={formatVnd(pending.reduce((sum, r) => sum + r.requestedRefund, 0))} unit="" foot="Các yêu cầu đang chờ" />
        <Stat icon="auto_awesome" label="Tỷ lệ AI thẩm định tự động" value="85%" unit="tự động" foot="Theo chính sách huỷ" tint={colors.primaryContainer} />
        <Stat icon="task_alt" label="Đã giải ngân hôm nay" value={`${requests.filter((r) => r.status === 'Đã duyệt hoàn tiền').length}`} unit="yêu cầu" foot="Đã chuyển khoản" tint="#2e7d55" />
      </Grid>
      <FilterChips
        items={[
          { key: 'all', label: 'Tất cả' },
          { key: 'pending', label: 'Chờ thẩm định' },
          { key: 'approved', label: 'Đã duyệt' },
          { key: 'rejected', label: 'Từ chối' },
        ]}
        value={filter}
        onChange={setFilter}
      />
      {list.map((r) => (
        <Card key={r.id}>
          <View style={s.between}>
            <Text variant="caption" weight="semibold" color={colors.onSurfaceVariant}>
              Mã đơn: {r.bookingId} · {r.createdAt}
            </Text>
            <Chip label={r.status} tone={statusTone[r.status]} />
          </View>
          <View>
            <Text variant="label" weight="bold">
              {r.guestName}
            </Text>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              {r.roomType}
            </Text>
          </View>
          <Text variant="small">
            <Text variant="small" color={colors.onSurfaceVariant}>
              Lý do yêu cầu:{' '}
            </Text>
            {r.reason}
          </Text>
          <KV label="Đã thanh toán" value={formatVnd(r.totalPaid)} />
          <KV label="Số tiền yêu cầu hoàn" value={formatVnd(r.requestedRefund)} strong />
          <View style={s.row}>
            <Icon name="auto_awesome" size={16} color={accent} />
            <Text variant="caption" style={s.flex}>
              Đánh giá AI chính sách: {r.systemRecommendation}
            </Text>
            <Chip label={`${r.policyComplianceScore}%`} tone={scoreTone(r.policyComplianceScore)} />
          </View>
          {r.status === 'Chờ thẩm định' && <Button label="Thẩm định" leadingIcon="policy" style={{ backgroundColor: accent }} onPress={() => open(r)} />}
        </Card>
      ))}

      <Sheet visible={!!selected} onClose={() => setSelected(null)} title={`Thẩm định yêu cầu #${selected?.id ?? ''}`}>
        {selected && (
          <>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              Đơn đặt phòng: {selected.bookingId} • Khách hàng {selected.guestName}
            </Text>
            <Banner
              icon="auto_awesome"
              tone="amber"
              title={`AI đánh giá điều khoản hủy phòng · Khả dụng ${selected.policyComplianceScore}%`}
              text={`Hệ thống đối soát thời gian hủy phòng trước 24-48 giờ. Mức phạt tiêu chuẩn của hạng phòng ${selected.roomType} là 20%. Đề xuất: ${selected.systemRecommendation}.`}
            />
            <View style={s.box}>
              <Text variant="caption" weight="bold" style={s.upper}>
                Tùy chỉnh mức hoàn tiền thực tế
              </Text>
              <View style={s.between}>
                <Text variant="small" color={colors.onSurfaceVariant}>
                  Tỷ lệ hoàn tiền
                </Text>
                <PercentStepper value={percent} onChange={setPercent} />
              </View>
              <KV label="Số tiền khách đã thanh toán" value={formatVnd(selected.totalPaid)} strong />
              <KV label="Số tiền HOÀN TRẢ CUỐI CÙNG" value={formatVnd((selected.totalPaid * percent) / 100)} strong color={success} />
            </View>
            <Input
              label="Ghi chú thẩm định / Lý do điều chỉnh"
              value={note}
              onChangeText={setNote}
              placeholder="Ví dụ: Khách xuất trình xác nhận hoãn chuyến bay từ Vietnam Airlines..."
            />
            <View style={s.row}>
              <Button label="Từ chối hoàn tiền" leadingIcon="cancel" variant="secondary" style={s.flex} onPress={() => decide('Từ chối')} />
              <Button label={`Duyệt hoàn ${percent}%`} leadingIcon="check_circle" style={[s.flex, { backgroundColor: accent }]} onPress={() => decide('Đã duyệt hoàn tiền')} />
            </View>
          </>
        )}
      </Sheet>
    </StaffScreen>
  );
}

const styles = StyleSheet.create({
  step: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.outlineVariant },
  percent: { minWidth: 64, textAlign: 'center' },
});
