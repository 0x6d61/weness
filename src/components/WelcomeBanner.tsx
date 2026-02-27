import React from 'react'
import { Box, Text } from 'ink'

interface WelcomeBannerProps {
  readonly provider: string
  readonly model: string
}

const YARN_BALL_ART = [
  "    .oOOOo.    ",
  "   oO     Oo   ",
  "  oO  ~~~  Oo  ",
  "  Oo  ~~~  oO  ",
  "   Oo     oO   ",
  "    'oOOOo'    ",
]

export function WelcomeBanner({ provider, model }: WelcomeBannerProps): React.ReactElement {
  return (
    <Box flexDirection="row" marginBottom={1}>
      <Box flexDirection="column">
        {YARN_BALL_ART.map((line, i) => (
          <Text key={i} color="yellow">{line}</Text>
        ))}
      </Box>
      <Box flexDirection="column" justifyContent="center" marginLeft={1}>
        <Text bold color="magenta">weness</Text>
        <Text dimColor>{provider} / {model}</Text>
      </Box>
    </Box>
  )
}
