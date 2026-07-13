import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Box from "@mui/material/Box";
import type { ServiceSummaryStats } from "@/types/serviceMaster";

const cards = [
  { key: "totalServices", label: "Total Services", color: "#4318ff" },
  { key: "mainServices", label: "Main Services", color: "#0085FF" },
  { key: "subServices", label: "Sub Services", color: "#7551FF" },
  { key: "activeServices", label: "Active Services", color: "#05CD99" },
  { key: "inactiveServices", label: "Inactive Services", color: "#EE5D50" },
] as const;

interface ServiceSummaryCardsProps {
  stats: ServiceSummaryStats;
  isLoading?: boolean;
}

export function ServiceSummaryCards({ stats, isLoading }: ServiceSummaryCardsProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
          lg: "repeat(5, 1fr)",
        },
      }}
    >
      {cards.map((card) => (
        <Card key={card.key} sx={{ height: "100%" }}>
          <CardContent>
            {isLoading ? (
              <Skeleton variant="rounded" height={56} />
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {card.label}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, color: card.color }}
                >
                  {stats[card.key]}
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
