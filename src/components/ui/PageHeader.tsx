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
  backLabel = "Zurück",
  showBackButton = true,
  showTitle = true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  description: _description,
}: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      {showBackButton && (
        <div style={{ marginBottom: 14 }}>
          <BackButton label={backLabel} />
        </div>
      )}
      {showTitle && (
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(22px, 5vw, 28px)",
            fontWeight: 800,
            color: "#1F1F1F",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          {title}
        </h1>
      )}
    </div>
  );
}
