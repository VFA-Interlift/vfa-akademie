import BackButton from "@/components/BackButton";

type PageHeaderProps = {
  title: string;
  description?: string;
  backLabel?: string;
  showBackButton?: boolean;
  showTitle?: boolean;
};

export default function PageHeader({
  title,
  description,
  backLabel = "Zurück",
  showBackButton = true,
  showTitle = true,
}: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 28 }}>
      {showBackButton && (
        <div style={{ marginBottom: 18 }}>
          <BackButton label={backLabel} />
        </div>
      )}

      <div
        style={{
          width: 58,
          height: 5,
          background: "#FFC100",
          marginBottom: 10,
        }}
      />

      {showTitle && (
        <h1
          style={{
            margin: 0,
            fontSize: 34,
            fontWeight: 400,
            letterSpacing: "0.02em",
            color: "#007873",
            textTransform: "uppercase",
            lineHeight: 1.15,
          }}
        >
          {title}
        </h1>
      )}

      {description && (
        <p
          style={{
            color: "#333333",
            marginTop: 18,
            marginBottom: 0,
            lineHeight: 1.65,
            maxWidth: 760,
            fontSize: 16,
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}