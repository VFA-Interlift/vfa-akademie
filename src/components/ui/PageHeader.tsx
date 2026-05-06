import BackButton from "@/components/BackButton";

type PageHeaderProps = {
  title: string;
  description?: string;
  backLabel?: string;
};

export default function PageHeader({
  title,
  description,
  backLabel = "Zurück",
}: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <BackButton label={backLabel} />

        <div>
          <div
            style={{
              width: 58,
              height: 5,
              background: "#FFC100",
              marginBottom: 10,
            }}
          />

          <h1
            style={{
              margin: 0,
              fontSize: 34,
              fontWeight: 400,
              letterSpacing: "0.02em",
              color: "#007873",
              textTransform: "uppercase",
            }}
          >
            {title}
          </h1>
        </div>
      </div>

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