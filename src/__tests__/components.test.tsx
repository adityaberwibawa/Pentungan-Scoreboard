import { render, screen } from '@testing-library/react-native';
import { AppButton } from '../components/AppButton';
import { RankBadge } from '../components/RankBadge';

describe('AppButton', () => {
  it('render label sebagai tombol dengan hint alasan saat disabled', async () => {
    await render(
      <AppButton label="Mulai Permainan" disabled disabledReason="Pilih minimal 2 pemain." onPress={() => undefined} />,
    );
    const btn = screen.getByRole('button', { name: 'Mulai Permainan' });
    expect(btn).toBeTruthy();
    expect(btn.props.accessibilityState).toMatchObject({ disabled: true });
  });
});

describe('RankBadge', () => {
  it('mengumumkan juara untuk peringkat 1', async () => {
    await render(<RankBadge rank={1} />);
    expect(screen.getByLabelText('Peringkat 1, juara')).toBeTruthy();
  });

  it('mengumumkan peringkat lain apa adanya', async () => {
    await render(<RankBadge rank={3} />);
    expect(screen.getByLabelText('Peringkat 3')).toBeTruthy();
  });
});
