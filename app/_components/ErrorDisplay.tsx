interface ErrorDisplayProps {
  message: string;
}

export function ErrorDisplay({ message }: ErrorDisplayProps) {
  return (
    <div className="s7-status-err">
      &gt; ERR :: {message}
    </div>
  );
}
