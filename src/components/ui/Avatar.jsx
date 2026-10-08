import { instrumentStyle } from '../../utils/constants.js';
import { initials } from '../../utils/selectors.js';

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-xl',
};

export default function Avatar({ student, size = 'md' }) {
  const st = instrumentStyle(student?.instrument);
  return (
    <div className={`${SIZES[size]} ${st.soft} relative shrink-0 rounded-full grid place-items-center font-semibold ring-2 ring-white`}>
      {initials(student)}
      <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ${st.dot} ring-2 ring-white`} />
    </div>
  );
}
