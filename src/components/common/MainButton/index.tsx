interface MainButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export default function MainButton({ children, onClick }: MainButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}
