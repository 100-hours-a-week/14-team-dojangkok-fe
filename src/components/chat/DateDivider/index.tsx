import styles from './DateDivider.module.css';

interface DateDividerProps {
  date: string;
}

export default function DateDivider({ date }: DateDividerProps) {
  return (
    <div className={styles.container}>
      <span className={styles.date}>{date}</span>
    </div>
  );
}
