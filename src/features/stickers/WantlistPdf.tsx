import { Document, Font, Image, Page, StyleSheet, Svg, Text, View } from '@react-pdf/renderer'
import type { Team } from '../../domain/types'

Font.register({
  family: 'ArchivoBlack',
  src: 'https://fonts.gstatic.com/s/archivoblack/v21/HTxqL289NzCGg4MzN6KJ7eW6OYuP.ttf',
})

export type WantlistTeamData = {
  team: Team
  total: number
  missingNumbers: string[]
}

type Props = {
  teams: WantlistTeamData[]
  generatedDate: string
}

const INK = '#0B0B0F'
const CREAM = '#F8F1DE'
const MUTE = '#6B6B72'
const RED = '#E83838'

// Text cast for SVG context — react-pdf uses the same Text primitive inside Svg
// but SVG attributes (x, y, fill, stroke) aren't in the DOM Text prop types.
const SvgText = Text as React.ComponentType<React.ComponentProps<typeof Text> & {
  x?: number
  y?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  fontSize?: number
  fontFamily?: string
}>

const s = StyleSheet.create({
  page: {
    backgroundColor: CREAM,
    paddingHorizontal: 32,
    paddingTop: 30,
    paddingBottom: 50,
  },
  headerLabel: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: MUTE,
    letterSpacing: 1,
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  titleBlock: {
    flex: 1,
  },
  titleStickers: {
    fontFamily: 'ArchivoBlack',
    fontSize: 56,
    color: INK,
    lineHeight: 1,
  },
  dateText: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: MUTE,
    letterSpacing: 1,
    paddingBottom: 6,
  },
  divider: {
    borderBottomWidth: 3,
    borderBottomColor: INK,
    marginTop: 8,
    marginBottom: 4,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
  },
  flagBox: {
    width: 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: INK,
    overflow: 'hidden',
    backgroundColor: '#fff',
    flexShrink: 0,
  },
  flagImg: {
    width: 52,
    height: 52,
  },
  teamInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 2,
  },
  teamName: {
    fontFamily: 'ArchivoBlack',
    fontSize: 14,
    color: INK,
  },
  teamMeta: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: MUTE,
    letterSpacing: 0.5,
  },
  teamSubtitle: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: MUTE,
    marginBottom: 6,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: INK,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  chipText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: INK,
  },
  badge: {
    width: 52,
    height: 52,
    backgroundColor: RED,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeNum: {
    fontFamily: 'ArchivoBlack',
    fontSize: 20,
    color: '#fff',
    lineHeight: 1,
  },
  badgeLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 6,
    color: '#fff',
    letterSpacing: 0.5,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: MUTE,
    borderBottomStyle: 'dashed',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: INK,
    paddingTop: 6,
  },
  footerText: {
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: MUTE,
    letterSpacing: 0.5,
  },
})

function flagPngUrl(svgUrl: string): string {
  const match = svgUrl.match(/flagcdn\.com\/(.+?)\.svg$/)
  return match ? `https://flagcdn.com/w40/${match[1]}.png` : svgUrl
}

function TeamRow({ item }: { item: WantlistTeamData }) {
  const { team, total, missingNumbers } = item
  return (
    <View>
      <View style={s.teamRow}>
        <View style={s.flagBox}>
          <Image src={flagPngUrl(team.flag)} style={s.flagImg} />
        </View>

        <View style={s.teamInfo}>
          <View style={s.nameRow}>
            <Text style={s.teamName}>{team.name.toUpperCase()}</Text>
            <Text style={s.teamMeta}>{team.id} · GRP {team.group}</Text>
          </View>
          <Text style={s.teamSubtitle}>{missingNumbers.length} OF {total} MISSING</Text>
          <View style={s.chipsWrap}>
            {missingNumbers.map((num) => (
              <View key={num} style={s.chip}>
                <Text style={s.chipText}>#{num}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.badge}>
          <Text style={s.badgeNum}>{missingNumbers.length}</Text>
          <Text style={s.badgeLabel}>LEFT</Text>
        </View>
      </View>
    </View>
  )
}

export function WantlistDocument({ teams, generatedDate }: Props) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.headerLabel}>WORLD CUP 2026 · STICKER WANTLIST</Text>

        <View style={s.titleRow}>
          <View style={s.titleBlock}>
            <Text style={s.titleStickers}>STICKERS</Text>
            {/* Outlined text via SVG stroke/fill — matches the hollow display style in the design */}
            <Svg height={70} width={531}>
              <SvgText x={0} y={60} fontFamily="ArchivoBlack" fontSize={56} fill="none" stroke={INK} strokeWidth={1.5}>
                WANTED.
              </SvgText>
            </Svg>
          </View>
          <Text style={s.dateText}>{generatedDate}</Text>
        </View>

        <View style={s.divider} />

        {teams.map((item, i) => (
          <View key={item.team.id} wrap={false}>
            <TeamRow item={item} />
            {i < teams.length - 1 && <View style={s.rowDivider} />}
          </View>
        ))}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>PRINTED FROM STICKERS TRACKER</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `PAGE ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
