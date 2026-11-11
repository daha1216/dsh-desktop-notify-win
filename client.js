window.__ModuleLoader__.load({
  id: 'dsh-desktop-notify-win',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const ENDPOINT = '/dsh-desktop-notify/api/config'

    const page = { padding: '24px', maxWidth: '680px', display: 'grid', gap: '18px' }
    const row = { display: 'grid', gridTemplateColumns: '210px 1fr', alignItems: 'center', gap: '16px' }
    const labelStyle = { color: 'var(--dsw-alias-label-primary)', fontSize: '13px' }
    const hintStyle = { color: 'var(--dsw-alias-label-secondary)', fontSize: '12px', marginTop: '3px', lineHeight: 1.5 }
    const sectionStyle = {
      border: '1px solid var(--dsw-alias-border-l1)',
      borderRadius: '12px',
      padding: '16px',
      display: 'grid',
      gap: '14px',
      background: 'var(--dsw-alias-bg-layer-1, transparent)',
    }
    const inputStyle = {
      background: 'var(--dsw-alias-bg-layer-2)',
      color: 'var(--dsw-alias-label-primary)',
      border: '1px solid var(--dsw-alias-border-l1)',
      borderRadius: '8px',
      padding: '6px 8px',
      fontSize: '13px',
      width: '100%',
      boxSizing: 'border-box',
    }
    const primaryButton = {
      background: '#1f6beb',
      color: '#ffffff',
      border: '1px solid #1f6beb',
      borderRadius: '8px',
      padding: '8px 18px',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
    }
    const secondaryButton = {
      background: 'transparent',
      color: 'var(--dsw-alias-label-primary)',
      border: '1px solid var(--dsw-alias-border-l1)',
      borderRadius: '8px',
      padding: '8px 16px',
      fontSize: '13px',
      cursor: 'pointer',
    }
    const monoValue = { color: 'var(--dsw-alias-label-secondary)', fontSize: '12px', minWidth: '56px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }

    const FONTS = [
      { value: 'Microsoft YaHei UI', label: '微软雅黑 UI（默认）' },
      { value: 'Microsoft YaHei', label: '微软雅黑' },
      { value: 'Segoe UI', label: 'Segoe UI' },
      { value: 'DengXian', label: '等线' },
      { value: 'SimSun', label: '宋体' },
    ]

    const PRESETS = [
      {
        id: 'classic',
        name: '经典深色',
        desc: '蓝条深底，默认外观',
        values: {
          accent: '#1f6beb',
          background: '#202020',
          text: '#ffffff',
          opacity: 0.97,
          width: 400,
          corner: 'br',
          marginX: 16,
          marginY: 16,
          radius: 12,
          padX: 20,
          padY: 16,
          accentWidth: 4,
          titleSize: 15,
          bodySize: 13,
          shadow: 0.45,
          shine: 0.05,
          progress: true,
          icon: true,
          fade: true,
          font: 'Microsoft YaHei UI',
          layout: 'bar',
        },
      },
      {
        id: 'light',
        name: '系统浅色',
        desc: '浅底深字，白天更清爽',
        values: {
          accent: '#1f6beb',
          background: '#f7f7f8',
          text: '#1a1a1a',
          opacity: 0.98,
          width: 400,
          corner: 'br',
          marginX: 16,
          marginY: 16,
          radius: 12,
          padX: 20,
          padY: 16,
          accentWidth: 4,
          titleSize: 15,
          bodySize: 13,
          shadow: 0.22,
          shine: 0.02,
          progress: true,
          icon: true,
          fade: true,
          font: 'Microsoft YaHei UI',
          layout: 'bar',
        },
      },
      {
        id: 'mono',
        name: '极简灰',
        desc: '低调，不抢注意力',
        values: {
          accent: '#8a8a8a',
          background: '#2b2b2b',
          text: '#f2f2f2',
          opacity: 0.95,
          width: 380,
          corner: 'br',
          marginX: 16,
          marginY: 16,
          radius: 10,
          padX: 18,
          padY: 15,
          accentWidth: 3,
          titleSize: 14,
          bodySize: 13,
          shadow: 0.35,
          shine: 0.03,
          progress: false,
          icon: false,
          fade: true,
          font: 'Microsoft YaHei UI',
          layout: 'bar',
        },
      },
      {
        id: 'contrast',
        name: '高对比',
        desc: '黑底黄条，强提醒',
        values: {
          accent: '#ffd400',
          background: '#000000',
          text: '#ffffff',
          opacity: 1,
          width: 420,
          corner: 'br',
          marginX: 12,
          marginY: 12,
          radius: 6,
          padX: 18,
          padY: 16,
          accentWidth: 6,
          titleSize: 16,
          bodySize: 14,
          shadow: 0.55,
          shine: 0,
          progress: true,
          icon: true,
          fade: false,
          font: 'Microsoft YaHei UI',
          layout: 'bar',
        },
      },
      {
        id: 'frost',
        name: '霜白圆角',
        desc: '大圆角浅底，像系统原生',
        values: {
          accent: '#0a84ff',
          background: '#fbfbfd',
          text: '#101013',
          opacity: 0.98,
          width: 420,
          corner: 'br',
          marginX: 16,
          marginY: 16,
          radius: 18,
          padX: 22,
          padY: 18,
          accentWidth: 3,
          titleSize: 15,
          bodySize: 13,
          shadow: 0.18,
          shine: 0.04,
          progress: true,
          icon: true,
          fade: true,
          font: 'Microsoft YaHei UI',
          layout: 'bar',
        },
      },
      {
        id: 'neon',
        name: '午夜霓虹',
        desc: '紫调深空，投影更重',
        values: {
          accent: '#7c5cff',
          background: '#0d0d14',
          text: '#ecebff',
          opacity: 0.99,
          width: 420,
          corner: 'br',
          marginX: 16,
          marginY: 16,
          radius: 16,
          padX: 22,
          padY: 18,
          accentWidth: 3,
          titleSize: 16,
          bodySize: 13,
          shadow: 0.75,
          shine: 0.1,
          progress: true,
          icon: true,
          fade: true,
          font: 'Microsoft YaHei UI',
          layout: 'bar',
        },
      },
      {
        id: 'cpamc',
        name: '卡片版式',
        desc: '图标加多行文字，信息量更大',
        values: {
          accent: '#7c8ff0',
          background: '#ffffff',
          text: '#111418',
          opacity: 1,
          width: 528,
          corner: 'br',
          marginX: 16,
          marginY: 16,
          radius: 18,
          padX: 24,
          padY: 28,
          accentWidth: 0,
          titleSize: 15,
          bodySize: 13,
          shadow: 0.45,
          shine: 0.02,
          progress: false,
          icon: true,
          fade: true,
          font: 'Microsoft YaHei UI',
          layout: 'card',
        },
      },
      {
        id: 'dsh',
        name: 'DSH 白卡',
        desc: '白底大卡，鲸鱼图标加四层文字',
        values: {
          accent: '#b96060',
          background: '#fdfdfe',
          text: '#262b35',
          opacity: 1,
          width: 531,
          corner: 'br',
          marginX: 16,
          marginY: 16,
          radius: 15,
          padX: 28,
          padY: 31,
          accentWidth: 0,
          titleSize: 15,
          bodySize: 13,
          shadow: 0.15,
          shine: 0,
          progress: false,
          icon: true,
          fade: true,
          font: 'Microsoft YaHei UI',
          layout: 'dsh',
          durationMs: 20000,
        },
      },
    ]

    const WHALE_PATH = 'M48.8354 10.0479C48.3232 9.79199 48.1025 10.2798 47.8032 10.5278C47.7007 10.6079 47.6143 10.7119 47.5273 10.8076C46.7793 11.624 45.9048 12.1597 44.7622 12.0957C43.0923 12 41.666 12.5356 40.4058 13.8398C40.1377 12.2319 39.2476 11.272 37.8926 10.6558C37.1836 10.3359 36.4668 10.0156 35.9702 9.31982C35.6235 8.82373 35.5293 8.27197 35.356 7.72754C35.2456 7.3999 35.1353 7.06396 34.7651 7.00781C34.3633 6.94385 34.2056 7.2876 34.0479 7.57568C33.418 8.75195 33.1733 10.0479 33.1973 11.3599C33.2524 14.312 34.4736 16.6641 36.8999 18.3359C37.1758 18.5278 37.2466 18.7197 37.1597 19C36.9946 19.5757 36.7974 20.1357 36.624 20.7119C36.5137 21.0801 36.3486 21.1597 35.9624 21C34.6309 20.4321 33.481 19.5918 32.4644 18.5757C30.7393 16.8721 29.1792 14.9917 27.2334 13.52C26.7764 13.1758 26.3193 12.856 25.8467 12.5518C23.8618 10.584 26.1069 8.96777 26.627 8.77588C27.1704 8.57568 26.8159 7.8877 25.0591 7.896C23.3022 7.90381 21.6953 8.50391 19.647 9.30371C19.3477 9.42383 19.0322 9.51172 18.7095 9.58398C16.8501 9.22363 14.9199 9.14355 12.9033 9.37598C9.10596 9.80762 6.07275 11.6396 3.84326 14.7681C1.16455 18.5278 0.53418 22.7998 1.30664 27.2559C2.11768 31.9521 4.46582 35.8398 8.07373 38.8799C11.8159 42.0322 16.1255 43.5762 21.041 43.2803C24.0269 43.104 27.3516 42.6963 31.1016 39.4561C32.0469 39.936 33.0396 40.1279 34.686 40.272C35.9546 40.3921 37.1758 40.208 38.1211 40.0078C39.6021 39.688 39.4995 38.2881 38.9639 38.0322C34.623 35.9678 35.5762 36.8081 34.71 36.1279C36.9155 33.4639 40.2402 30.6958 41.54 21.728C41.6426 21.0161 41.5557 20.5679 41.54 19.9917C41.5322 19.6396 41.6108 19.5039 42.0049 19.4639C43.0923 19.3359 44.1479 19.0317 45.1167 18.4878C47.9292 16.9199 49.064 14.3438 49.3315 11.2559C49.3711 10.7837 49.3237 10.2959 48.8354 10.0479ZM24.3262 37.8398C20.1196 34.4639 18.0791 33.3521 17.2358 33.3999C16.4482 33.4482 16.5898 34.3682 16.7632 34.9678C16.9443 35.5601 17.1812 35.9683 17.5117 36.4878C17.7402 36.832 17.8979 37.3442 17.2832 37.728C15.9282 38.584 13.5728 37.4399 13.4624 37.3838C10.7207 35.7358 8.42822 33.5601 6.81348 30.584C5.25342 27.7197 4.34766 24.6479 4.19775 21.3677C4.1582 20.5757 4.38672 20.2959 5.15869 20.1519C6.17529 19.96 7.22314 19.9199 8.23926 20.0718C12.5327 20.7119 16.1885 22.6719 19.2529 25.7759C21.002 27.5439 22.3252 29.6558 23.6885 31.7202C25.1377 33.9121 26.6978 36 28.6831 37.7119C29.3843 38.312 29.9434 38.7681 30.479 39.104C28.8643 39.2881 26.1699 39.3281 24.3262 37.8398ZM26.3433 24.6001C26.3433 24.248 26.6191 23.9678 26.9658 23.9678C27.0444 23.9678 27.1152 23.9839 27.1782 24.0078C27.2651 24.04 27.3438 24.0879 27.4067 24.1602C27.5171 24.272 27.5801 24.4321 27.5801 24.6001C27.5801 24.9521 27.3042 25.2319 26.9575 25.2319C26.6108 25.2319 26.3433 24.9521 26.3433 24.6001ZM32.6064 27.8799C32.2046 28.0479 31.8027 28.1919 31.4165 28.208C30.8179 28.2397 30.1641 27.9922 29.8096 27.688C29.2583 27.2158 28.8643 26.9521 28.6987 26.1279C28.6279 25.7759 28.6675 25.2319 28.7305 24.9199C28.8721 24.248 28.7144 23.8159 28.2495 23.4238C27.8716 23.104 27.3911 23.0161 26.8633 23.0161C26.666 23.0161 26.4849 22.9277 26.3511 22.856C26.1304 22.7441 25.9492 22.4639 26.1226 22.1201C26.1777 22.0078 26.4458 21.7358 26.5088 21.688C27.2256 21.272 28.0527 21.4077 28.8169 21.7197C29.5259 22.0161 30.0615 22.5601 30.834 23.3281C31.6216 24.2559 31.7632 24.5117 32.2124 25.208C32.5669 25.752 32.8901 26.312 33.1104 26.9521C33.2446 27.3521 33.0713 27.6802 32.6064 27.8799Z'

    function luminance(hex) {
      const match = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''))
      if (!match) return 0
      const value = parseInt(match[1], 16)
      const r = (value >> 16) & 255
      const g = (value >> 8) & 255
      const b = value & 255
      return (r * 299 + g * 587 + b * 114) / 1000
    }

    function num(value, fallback) {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : fallback
    }

    function parseHex(hex) {
      const match = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''))
      if (!match) return null
      const value = parseInt(match[1], 16)
      return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
    }

    function mixHex(a, b, t) {
      const first = parseHex(a)
      const second = parseHex(b)
      if (!first || !second) return a
      const channels = first.map((value, index) => Math.round(value + (second[index] - value) * t))
      return '#' + channels.map((value) => value.toString(16).padStart(2, '0')).join('')
    }

    function coolHex(hex, dr, dg, db) {
      const rgb = parseHex(hex)
      if (!rgb) return hex
      const channels = [rgb[0] + dr, rgb[1] + dg, rgb[2] + db].map((value) => Math.max(0, Math.min(255, value)))
      return '#' + channels.map((value) => value.toString(16).padStart(2, '0')).join('')
    }

    function Section(props) {
      return h(
        'section',
        { style: sectionStyle },
        h(
          'div',
          null,
          h('div', { style: { color: 'var(--dsw-alias-label-primary)', fontSize: '14px', fontWeight: 600 } }, props.title),
          props.hint ? h('div', { style: hintStyle }, props.hint) : null,
        ),
        props.children,
      )
    }

    function Field(props) {
      return h(
        'div',
        { style: row },
        h(
          'div',
          null,
          h('div', { style: labelStyle }, props.title),
          props.desc ? h('div', { style: hintStyle }, props.desc) : null,
        ),
        h('div', null, props.children),
      )
    }

    function ColorField(props) {
      return h(
        'div',
        { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
        h('input', {
          type: 'color',
          value: props.value,
          'aria-label': props.title,
          onChange: (event) => props.onChange(event.target.value),
          style: {
            width: '44px',
            height: '30px',
            padding: '0',
            border: '1px solid var(--dsw-alias-border-l1)',
            borderRadius: '6px',
            background: 'transparent',
            cursor: 'pointer',
          },
        }),
        h('input', {
          type: 'text',
          value: props.value,
          'aria-label': props.title,
          onChange: (event) => props.onChange(event.target.value),
          style: Object.assign({}, inputStyle, { width: '130px' }),
        }),
      )
    }

    function Slider(props) {
      const step = props.step === undefined ? 1 : props.step
      const text = props.format ? props.format(props.value) : String(props.value)
      return h(
        'div',
        { style: { display: 'flex', gap: '12px', alignItems: 'center' } },
        h('input', {
          type: 'range',
          min: props.min,
          max: props.max,
          step: step,
          value: props.value,
          'aria-label': props.title,
          onChange: (event) => props.onChange(Number(event.target.value)),
          style: { flex: '1 1 auto', maxWidth: '260px', minWidth: '120px' },
        }),
        h('span', { style: monoValue }, text),
      )
    }

    function Switch(props) {
      return h(
        'label',
        { style: { display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--dsw-alias-label-primary)', fontSize: '13px', cursor: 'pointer' } },
        h('input', {
          type: 'checkbox',
          checked: Boolean(props.checked),
          onChange: (event) => props.onChange(event.target.checked),
        }),
        props.checked ? '开' : '关',
      )
    }

    function PresetCard(props) {
      const preset = props.preset
      const active = props.active
      const values = preset.values
      const radius = Math.min(8, num(values.radius, 12) * 0.45)
      const barWidth = Math.max(2, Math.min(6, num(values.accentWidth, 4)))
      const cardStyle = values.layout === 'card' || values.layout === 'dsh'
      const thumbBorder = values.layout === 'dsh' ? mixHex(values.background, values.text, 0.12) : values.accent
      return h(
        'button',
        {
          type: 'button',
          onClick: () => props.onPick(preset),
          'aria-pressed': active,
          style: {
            textAlign: 'left',
            padding: '10px 12px',
            borderRadius: '10px',
            border: active ? '2px solid var(--dsw-alias-brand-primary)' : '1px solid var(--dsw-alias-border-l1)',
            background: 'var(--dsw-alias-bg-layer-2)',
            cursor: 'pointer',
            display: 'grid',
            gap: '6px',
            font: 'inherit',
          },
        },
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
          h('span', {
            style: {
              width: cardStyle ? '34px' : '26px',
              height: cardStyle ? '22px' : '18px',
              borderRadius: (cardStyle ? 6 : radius) + 'px',
              border: '1px solid ' + thumbBorder,
              background: cardStyle ? values.background : 'linear-gradient(90deg, ' + values.accent + ' 0 ' + barWidth + 'px, ' + values.background + ' ' + barWidth + 'px 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              padding: cardStyle ? '0 4px' : '0',
              boxSizing: 'border-box',
              flex: '0 0 auto',
            },
          },
            cardStyle
              ? [
                  h('span', {
                    key: 'icon',
                    style: {
                      width: '7px',
                      height: '7px',
                      borderRadius: '2px',
                      background: values.accent + '2e',
                      border: '1px solid ' + thumbBorder,
                      flex: '0 0 auto',
                    },
                  }),
                  h('span', { key: 'lines', style: { display: 'grid', gap: '2px', flex: '1 1 auto' } },
                    h('span', { style: { height: '3px', width: '86%', borderRadius: '2px', background: values.text, opacity: 0.85 } }),
                    h('span', { style: { height: '2px', width: '62%', borderRadius: '2px', background: values.text, opacity: 0.35 } }),
                  ),
                ]
              : null),

          h(
            'span',
            { style: { color: 'var(--dsw-alias-label-primary)', fontSize: '13px', fontWeight: active ? 600 : 500 } },
            preset.name,
          ),
        ),
        h('div', { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: '11.5px', lineHeight: 1.45 } }, preset.desc),
      )
    }

    function ToastPreview(props) {
      const settings = props.settings
      const boxRef = React.useRef(null)
      const [boxWidth, setBoxWidth] = React.useState(620)

      React.useEffect(() => {
        const element = boxRef.current
        if (!element) return undefined
        const update = () => setBoxWidth(element.clientWidth || 620)
        update()
        let observer
        if (typeof ResizeObserver !== 'undefined') {
          observer = new ResizeObserver(update)
          observer.observe(element)
        }
        window.addEventListener('resize', update)
        return () => {
          if (observer) observer.disconnect()
          window.removeEventListener('resize', update)
        }
      }, [])

      const cardWidth = Math.max(240, Math.min(720, num(settings.width, 400)))
      const userScale = Math.max(0.5, Math.min(1.5, num(settings.scale, 1)))
      const scale = Math.min(1, Math.max(0.2, Math.min(1, (boxWidth - 120) / cardWidth)) * userScale)
      const corner = settings.corner || 'br'
      const vertical = corner.charAt(0) === 'b' ? 'bottom' : 'top'
      const horizontal = corner.charAt(1) === 'r' ? 'right' : 'left'

      const radius = Math.max(0, Math.min(28, num(settings.radius, 12)))
      const padX = Math.max(12, Math.min(40, num(settings.padX, 20)))
      const padY = Math.max(10, Math.min(32, num(settings.padY, 16)))
      const accentWidth = Math.max(0, Math.min(14, num(settings.accentWidth, 4)))
      const titleSize = Math.max(11, Math.min(22, num(settings.titleSize, 15)))
      const bodySize = Math.max(10, Math.min(20, num(settings.bodySize, 13)))
      const shadowStrength = Math.max(0, Math.min(1, num(settings.shadow, 0.45)))
      const shine = Math.max(0, Math.min(0.3, num(settings.shine, 0.05)))
      const iconOn = settings.icon !== false
      const progressOn = settings.progress !== false
      const font = typeof settings.font === 'string' && settings.font ? settings.font : 'Microsoft YaHei UI'

      const accent = settings.accent
      const sub = luminance(settings.background) > 140 ? 'rgba(0,0,0,0.62)' : 'rgba(255,255,255,0.72)'
      const opacity = Math.max(0.5, Math.min(1, num(settings.opacity, 1)))
      const iconSpace = iconOn ? 15 : 0

      const shadowLayers = [
        '0 1px 2px rgba(0,0,0,' + (0.16 + 0.24 * shadowStrength).toFixed(3) + ')',
        '0 6px 16px -6px rgba(0,0,0,' + (0.14 + 0.34 * shadowStrength).toFixed(3) + ')',
        '0 18px 34px -18px rgba(0,0,0,' + (0.12 + 0.42 * shadowStrength).toFixed(3) + ')',
      ].join(', ')

      const insetX = 26 + Math.max(0, num(settings.marginX, 16))
      const insetY = 22 + Math.max(0, num(settings.marginY, 16))
      const position = {}
      position[horizontal] = insetX + 'px'
      position[vertical] = insetY + 'px'

      const isCard = settings.layout === 'card'
      const isDsh = settings.layout === 'dsh'
      const dshLight = luminance(settings.background) > 140
      const dshBorder = dshLight ? coolHex(mixHex(settings.background, settings.text, 0.1), -2, 0, 2) : mixHex(settings.background, '#ffffff', 0.14)
      const dshTileBg = dshLight ? coolHex(mixHex(settings.background, settings.text, 0.055), 0, 2, 4) : mixHex(settings.background, '#ffffff', 0.09)
      const dshIconColor = dshLight ? mixHex(settings.text, settings.background, 0.36) : mixHex(settings.text, settings.background, 0.42)
      const dshAppColor = dshLight ? coolHex(mixHex(settings.text, settings.background, 0.3), 1, 7, 16) : mixHex(settings.text, settings.background, 0.34)
      const dshBodyColor = dshLight ? coolHex(mixHex(settings.text, settings.background, 0.33), 0, 4, 9) : mixHex(settings.text, settings.background, 0.38)
      const dshMetaColor = dshLight ? coolHex(mixHex(settings.text, settings.background, 0.38), 0, 2, 9) : mixHex(settings.text, settings.background, 0.42)
      const dshLinkColor = dshLight ? coolHex(mixHex(settings.text, settings.background, 0.22), 0, 6, 18) : mixHex(settings.text, settings.background, 0.3)
      const dshCloseColor = dshLight ? coolHex(mixHex(settings.text, settings.background, 0.55), 0, 4, 9) : mixHex(settings.text, settings.background, 0.45)
      const dshAppName = (typeof settings.eyebrow === 'string' && settings.eyebrow.trim()) || 'DeepSeek Harness'
      const dshSeconds = Math.round(Math.max(3, Math.min(120, num(settings.durationMs, 20000) / 1000)))
      const dshFooterText = (typeof settings.status === 'string' && settings.status) || dshSeconds + ' 秒后收起 · 悬停可保留'
      const dshAppSize = Math.max(12, Math.min(26, titleSize * 1.15))
      const dshTitleSize = Math.max(18, Math.min(40, titleSize * 1.6))
      const dshBodySize = Math.max(11, Math.min(34, bodySize * 1.385))
      const dshMetaSize = Math.max(10, Math.min(26, bodySize * 1.15))
      const dshLinkSize = Math.max(10, Math.min(28, bodySize * 1.27))
      const dshTextLeft = 101
      const dshRightPad = 25
      const body = '会话：整理本周计划\n会话已空闲，切回去看看。'
      const titleParts = 'DSH · 本轮完成'.split(' · ')
      const eyebrow = titleParts.length > 1 ? titleParts[0] : 'DSH'
      const title = isCard ? titleParts.slice(1).join(' · ') : 'DSH · 本轮完成'
      const statusText = (typeof settings.status === 'string' && settings.status) || '点击卡片切回会话'
      const cardIconBox = Math.round(Math.min(56, Math.max(36, padX * 2.3)))
      const cardTitleSize = Math.min(34, Math.max(19, titleSize * 1.85))
      const textColumn = iconOn ? '3 / -1' : '1 / -1'

      const barContent = h(
        'div',
        { style: { padding: padY + 'px ' + padX + 'px', paddingLeft: padX + accentWidth + 'px' } },
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: '8px', marginLeft: iconSpace + 'px' } },
          iconOn
            ? h('span', {
                style: {
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: accent,
                  flex: '0 0 auto',
                  marginLeft: '-15px',
                },
              })
            : null,
          h(
            'div',
            { style: { color: settings.text, fontSize: titleSize + 'px', fontWeight: 600, lineHeight: 1.34, letterSpacing: '-0.01em' } },
            title,
          ),
        ),
        h(
          'div',
          {
            style: {
              color: sub,
              fontSize: bodySize + 'px',
              lineHeight: 1.45,
              marginTop: '5px',
              marginLeft: iconSpace + 'px',
              whiteSpace: 'pre-line',
            },
          },
          body,
        ),
      )

      const cardContent = h(
        'div',
        {
          style: {
            padding: padY + 'px ' + padX + 'px',
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            columnGap: '12px',
            alignItems: 'start',
          },
        },
        iconOn
          ? h(
              'div',
              {
                style: {
                  gridColumn: '1 / span 2',
                  width: '100%',
                  maxWidth: cardIconBox + 'px',
                  aspectRatio: '1 / 1',
                  borderRadius: Math.round(cardIconBox * 0.23) + 'px',
                  background: accent + '1a',
                  border: '1px solid ' + accent + '3d',
                  display: 'grid',
                  placeItems: 'center',
                },
              },
              h(
                'svg',
                { viewBox: '0 0 56 56', width: '68%', height: '68%', focusable: 'false' },
                h(
                  'g',
                  { fill: 'none', stroke: accent, strokeLinejoin: 'round' },
                  h('rect', { x: '11', y: '11', width: '34', height: '34', rx: '4', transform: 'rotate(45 28 28)', strokeWidth: '2.6', opacity: '0.45' }),
                  h('rect', { x: '16', y: '16', width: '24', height: '24', rx: '3', transform: 'rotate(45 28 28)', strokeWidth: '2.1', opacity: '0.9' }),
                  h('rect', { x: '21.5', y: '21.5', width: '13', height: '13', rx: '2', transform: 'rotate(45 28 28)', strokeWidth: '0', fill: accent, opacity: '0.28' }),
                  h('circle', { cx: '28', cy: '28', r: '2', fill: accent }),
                ),
              ),
            )
          : null,
        h(
          'div',
          { style: { gridColumn: textColumn, minWidth: 0 } },
          h(
            'div',
            {
              style: {
                color: sub,
                fontSize: Math.round(bodySize * 0.92) + 'px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              },
            },
            eyebrow,
          ),
          h(
            'div',
            {
              style: {
                color: settings.text,
                fontSize: cardTitleSize + 'px',
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: '-0.015em',
                marginTop: '3px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
            },
            title,
          ),
          h(
            'div',
            {
              style: {
                color: sub,
                fontSize: Math.round(bodySize * 1.15) + 'px',
                lineHeight: 1.5,
                marginTop: '9px',
                whiteSpace: 'pre-line',
              },
            },
            body,
          ),
          h(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '17px', color: sub, fontSize: bodySize + 'px' } },
            h('span', {
              style: {
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: accent,
                flex: '0 0 auto',
                boxShadow: '0 0 0 3px ' + accent + '26',
              },
            }),
            statusText,
          ),
        ),
      )

      const dshContent = h(
        'div',
        { style: { position: 'relative', padding: '27px ' + dshRightPad + 'px 14px ' + dshTextLeft + 'px' } },
        h(
          'div',
          {
            style: {
              position: 'absolute',
              left: '29px',
              top: '32px',
              width: '51px',
              height: '51px',
              borderRadius: '10px',
              background: dshTileBg,
              display: 'grid',
              placeItems: 'center',
            },
          },
          h(
            'svg',
            { viewBox: '0 0 50 50', width: '39px', height: '39px', focusable: 'false' },
            h('path', { d: WHALE_PATH, fill: dshIconColor }),
          ),
        ),
        h(
          'div',
          {
            style: {
              fontSize: dshAppSize + 'px',
              fontWeight: 600,
              lineHeight: '20px',
              letterSpacing: '0.12px',
              color: dshAppColor,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          },
          dshAppName,
        ),
        h(
          'div',
          {
            style: {
              fontSize: dshTitleSize + 'px',
              fontWeight: 700,
              lineHeight: '30px',
              marginTop: '5px',
              color: settings.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          },
          title,
        ),
        h(
          'div',
          {
            style: {
              fontSize: dshBodySize + 'px',
              lineHeight: '30.5px',
              marginTop: '12px',
              whiteSpace: 'pre-line',
              color: dshBodyColor,
            },
          },
          body,
        ),
        h(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '14px',
              height: '32px',
              fontSize: dshMetaSize + 'px',
              color: dshMetaColor,
            },
          },
          h('span', { style: { width: '7px', height: '7.6px', borderRadius: '50%', background: accent, flex: '0 0 auto' } }),
          dshFooterText,
          h(
            'div',
            {
              style: {
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: dshLinkSize + 'px',
                color: dshLinkColor,
                whiteSpace: 'nowrap',
              },
            },
            '点击切回',
            h('span', { style: { fontSize: dshLinkSize + 1 + 'px' } }, '›'),
          ),
        ),
        h(
          'div',
          { style: { position: 'absolute', right: '25px', top: '33px', width: '15px', height: '15px' } },
          h(
            'svg',
            { viewBox: '0 0 15 15', width: '15px', height: '15px', focusable: 'false' },
            h('path', {
              d: 'M2 2 L13 13 M13 2 L2 13',
              stroke: dshCloseColor,
              strokeWidth: '1.6',
              strokeLinecap: 'round',
              fill: 'none',
            }),
          ),
        ),
      )

      return h(
        'div',
        {
          ref: boxRef,
          style: {
            position: 'relative',
            height: '248px',
            borderRadius: '12px',
            border: '1px solid var(--dsw-alias-border-l1)',
            background: 'var(--dsw-alias-bg-layer-2)',
            overflow: 'hidden',
          },
        },
        h(
          'div',
          { style: { position: 'absolute', top: '10px', left: '14px', color: 'var(--dsw-alias-label-secondary)', fontSize: '11.5px' } },
          '鼠标所在显示器（示意，按比例缩放）',
        ),
        h(
          'div',
          {
            style: Object.assign(
              {
                position: 'absolute',
                width: cardWidth + 'px',
                background: settings.background,
                borderRadius: radius + 'px',
                border: isDsh ? '1px solid ' + dshBorder : undefined,
                boxShadow: isDsh ? 'inset 1px 1px 0 ' + dshBorder + ', 0 2px 8px rgba(16,24,40,0.03)' : shadowLayers,
                opacity: opacity,
                transform: 'scale(' + scale + ')',
                transformOrigin: vertical + ' ' + horizontal,
                overflow: 'hidden',
                pointerEvents: 'none',
                fontFamily: '"' + font + '", "Microsoft YaHei UI", "Segoe UI", system-ui, sans-serif',
              },
              position,
            ),
          },
          accentWidth > 0 && !isCard && !isDsh
            ? h('div', {
                style: {
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: accentWidth + 'px',
                  background: 'linear-gradient(180deg, ' + accent + ' 0%, ' + accent + '59 100%)',
                },
              })
            : null,
          shine > 0 && !isDsh
            ? h('div', {
                style: {
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  height: '46%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,' + (shine + 0.03).toFixed(3) + ') 0%, rgba(255,255,255,0) 100%)',
                },
              })
            : null,
          isDsh ? dshContent : isCard ? cardContent : barContent,
          progressOn && !isCard && !isDsh
            ? h('div', {
                style: {
                  position: 'absolute',
                  left: padX + accentWidth + 'px',
                  bottom: Math.round(padY * 0.48) + 'px',
                  width: '62%',
                  height: '2px',
                  borderRadius: '1px',
                  background: accent,
                  opacity: 0.72,
                },
              })
            : null,
        ),
      )
    }


    const API = '/dsh-desktop-notify/api'

    const EVENT_LABELS = {
      turnEnd: '本轮完成',
      question: '需要回答',
      approval: '需要授权',
      error: '执行出错',
      startup: '插件启动',
      test: '测试通知',
      replay: '重播',
    }

    const SUPPRESS_LABELS = {
      disabled: '事件已关闭',
      quiet: '免打扰时段',
      foreground: 'DSH 正在前台',
      fullscreen: '全屏或系统勿扰',
      coalesced: '重复通知已合并',
      replaced: '被更新的通知替换',
      error: '发送失败',
      failed: '发送失败',
      timeout: '等待超时',
      'spawn-failed': '渲染进程启动失败',
      'unsupported-platform': '当前系统不支持',
    }

    const LAYOUT_LABELS = { bar: '横条', card: '卡片', dsh: 'DSH 原生' }

    function getJson(url) {
      return fetch(url, { cache: 'no-store' }).then((response) =>
        response.json().catch(() => null).then((data) => {
          if (!response.ok) throw new Error(data && data.message ? data.message : 'HTTP ' + response.status)
          return data
        }),
      )
    }

    function postJson(url, body) {
      return fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }).then((response) =>
        response.json().catch(() => null).then((data) => {
          if (!response.ok) throw new Error(data && data.message ? data.message : 'HTTP ' + response.status)
          return data
        }),
      )
    }

    function relativeLuminance(hex) {
      const rgb = parseHex(hex)
      if (!rgb) return 0
      const channels = rgb.map((value) => {
        const channel = value / 255
        return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
    }

    function contrastRatio(first, second) {
      const a = relativeLuminance(first)
      const b = relativeLuminance(second)
      const high = Math.max(a, b)
      const low = Math.min(a, b)
      return (high + 0.05) / (low + 0.05)
    }

    function formatClock(iso) {
      const date = new Date(iso)
      if (Number.isNaN(date.getTime())) return ''
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }

    function formatDate(iso) {
      const date = new Date(iso)
      if (Number.isNaN(date.getTime())) return ''
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
    }

    function formatSeconds(ms) {
      return (Math.round(Number(ms || 0) / 1000) || 0) + ' 秒'
    }

    function Row(props) {
      const rawId = React.useId()
      const id = 'notify-row-' + String(rawId).replace(/:/g, '')
      return h(
        'div',
        { style: { display: 'grid', gridTemplateColumns: 'minmax(150px, 220px) minmax(0, 1fr)', gap: '16px', alignItems: 'center', padding: '5px 0' } },
        h(
          'div',
          { style: { minWidth: 0 } },
          h('div', { id: id, style: labelStyle }, props.title),
          props.desc ? h('div', { style: hintStyle }, props.desc) : null,
          props.note ? h('div', { style: Object.assign({}, hintStyle, { color: 'var(--dsw-alias-label-secondary)', fontStyle: 'italic' }) }, props.note) : null,
        ),
        h(
          'div',
          {
            role: 'group',
            'aria-labelledby': id,
            style: { display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', opacity: props.disabled ? 0.55 : 1 },
          },
          props.children,
        ),
      )
    }

    function SubHead(props) {
      return h(
        'div',
        { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.04em', marginTop: '4px' } },
        props.children,
      )
    }

    function Segmented(props) {
      return h(
        'div',
        { role: 'group', 'aria-label': props.label, style: { display: 'flex', flexWrap: 'wrap', gap: '6px' } },
        props.options.map((option) =>
          h(
            'button',
            {
              key: option.value,
              type: 'button',
              'aria-pressed': props.value === option.value,
              onClick: () => props.onChange(option.value),
              style: {
                padding: '6px 12px',
                borderRadius: '8px',
                border: props.value === option.value ? '1px solid var(--dsw-alias-brand-primary)' : '1px solid var(--dsw-alias-border-l1)',
                background: props.value === option.value ? 'var(--dsw-alias-bg-layer-2)' : 'transparent',
                color: 'var(--dsw-alias-label-primary)',
                fontSize: '12.5px',
                fontWeight: props.value === option.value ? 600 : 400,
                cursor: 'pointer',
                font: 'inherit',
              },
            },
            option.label,
          ),
        ),
      )
    }

    function Chip(props) {
      return h(
        'button',
        {
          type: 'button',
          onClick: props.onClick,
          'aria-pressed': Boolean(props.active),
          style: {
            padding: '4px 9px',
            borderRadius: '999px',
            border: '1px solid var(--dsw-alias-border-l1)',
            background: props.active ? 'var(--dsw-alias-bg-layer-2)' : 'transparent',
            color: 'var(--dsw-alias-label-secondary)',
            fontSize: '11.5px',
            cursor: 'pointer',
            font: 'inherit',
          },
        },
        props.children,
      )
    }

    function SummaryLine(props) {
      return h(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '12px' } },
        h('span', { style: { color: 'var(--dsw-alias-label-secondary)' } }, props.label),
        h('span', { style: { color: 'var(--dsw-alias-label-primary)', textAlign: 'right' } }, props.value),
      )
    }

    function SettingsPage(props) {
      const boot = props && props.initialConfig ? props.initialConfig : null
      const [config, setConfig] = React.useState(boot)
      const [meta, setMeta] = React.useState(props && props.initialMeta ? props.initialMeta : null)
      const [saved, setSaved] = React.useState(boot ? boot.settings : null)
      const [status, setStatus] = React.useState('')
      const [busy, setBusy] = React.useState(false)
      const [advanced, setAdvanced] = React.useState(Boolean(props && props.initialAdvanced))
      const [importOpen, setImportOpen] = React.useState(false)
      const [importText, setImportText] = React.useState('')
      const [confirmClear, setConfirmClear] = React.useState(false)
      const [confirmReset, setConfirmReset] = React.useState(false)

      React.useEffect(() => {
        let alive = true
        getJson(API + '/config')
          .then((data) => {
            if (!alive) return
            setConfig(data)
            setSaved(data.settings)
            getJson(API + '/meta').then((value) => {
              if (alive) setMeta(value)
            }).catch(() => {})
          })
          .catch((error) => {
            if (alive) setStatus('读取设置失败：' + error.message)
          })
        return () => {
          alive = false
        }
      }, [])

      const settings = config ? config.settings : null
      const history = config && Array.isArray(config.history) ? config.history : []
      const dirty = Boolean(settings && saved && JSON.stringify(settings) !== JSON.stringify(saved))

      React.useEffect(() => {
        if (!dirty) return undefined
        const guard = (event) => {
          event.preventDefault()
          event.returnValue = ''
        }
        window.addEventListener('beforeunload', guard)
        return () => window.removeEventListener('beforeunload', guard)
      }, [dirty])

      if (!settings) {
        return h(
          'div',
          { style: { padding: '28px', color: 'var(--dsw-alias-label-secondary)', fontSize: '13px' } },
          status || '正在读取设置…',
        )
      }

      const defaults = (meta && meta.defaults) || settings
      const limits = (meta && meta.limits) || {}
      const presets = (meta && Array.isArray(meta.presets) && meta.presets.length ? meta.presets : PRESETS)
      const events = (meta && Array.isArray(meta.events) ? meta.events : [
        { key: 'onTurnEnd', event: 'turnEnd', label: '本轮完成', desc: '主会话空闲时提醒' },
        { key: 'onQuestion', event: 'question', label: '需要回答', desc: 'Agent 向你提问时提醒' },
        { key: 'onApproval', event: 'approval', label: '需要授权', desc: '工具调用等你确认时提醒' },
        { key: 'onError', event: 'error', label: '执行出错', desc: 'Agent 步骤失败时提醒' },
        { key: 'onStartup', event: 'startup', label: '插件启动', desc: 'DSH 启动或插件重载后弹一条' },
      ])
      const fonts = (meta && Array.isArray(meta.fonts) && meta.fonts.length ? meta.fonts : FONTS)
      const version = (meta && meta.version) || config.version || '0.5.0'
      const build = (meta && meta.build) || config.build || 20
      const layout = settings.layout
      const isDsh = layout === 'dsh'
      const isCard = layout === 'card'
      const isBar = layout === 'bar'
      const patch = (values) => setConfig((prev) => (prev ? Object.assign({}, prev, { settings: Object.assign({}, prev.settings, values) }) : prev))

      const presetActive = (preset) => {
        const values = preset.values || {}
        return Object.keys(values).every((key) => settings[key] === values[key])
      }

      const save = () => {
        setBusy(true)
        postJson(API + '/config', { action: 'save', settings: settings })
          .then((data) => {
            setConfig((prev) => (Object.assign({}, prev, { settings: data.settings })))
            setSaved(data.settings)
            setStatus('已保存并生效')
          })
          .catch((error) => setStatus('保存失败：' + error.message))
          .finally(() => setBusy(false))
      }

      const loadHistory = () => {
        getJson(API + '/history')
          .then((data) => {
            setConfig((prev) => (prev ? Object.assign({}, prev, { history: data.history || [] }) : prev))
          })
          .catch(() => {})
      }

      const test = () => {
        setBusy(true)
        postJson(API + '/config', { action: 'test', settings: settings })
          .then(() => {
            setStatus('已按当前值弹出测试通知')
            window.setTimeout(loadHistory, 250)
          })
          .catch((error) => setStatus('测试失败：' + error.message))
          .finally(() => setBusy(false))
      }

      const replay = (id) => {
        postJson(API + '/config', { action: 'replay', id: id })
          .then(() => {
            setStatus('已重新显示')
            window.setTimeout(loadHistory, 250)
          })
          .catch((error) => setStatus('重播失败：' + error.message))
      }

      const clearHistory = () => {
        if (!confirmClear) {
          setConfirmClear(true)
          setStatus('再点一次“确认清空”才会删除全部历史')
          return
        }
        setConfirmClear(false)
        postJson(API + '/config', { action: 'clear' })
          .then(() => {
            setConfig((prev) => (prev ? Object.assign({}, prev, { history: [] }) : prev))
            setStatus('历史已清空')
          })
          .catch((error) => setStatus('清空失败：' + error.message))
      }

      const applyPreset = (preset) => patch(preset.values || {})

      const exportSettings = () => {
        const payload = JSON.stringify({ schemaVersion: 2, exportedAt: new Date().toISOString(), settings: settings }, null, 2)
        const blob = new Blob([payload], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'dsh-desktop-notify-settings.json'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
        setStatus('已导出当前设置')
      }

      const applyImport = () => {
        try {
          const parsed = JSON.parse(importText)
          const source = parsed && parsed.settings ? parsed.settings : parsed && parsed.values ? parsed.values : parsed
          if (!source || typeof source !== 'object') throw new Error('文件内容不是对象')
          const allowed = Object.keys(defaults)
          const picked = {}
          allowed.forEach((key) => {
            if (Object.prototype.hasOwnProperty.call(source, key)) picked[key] = source[key]
          })
          if (!Object.keys(picked).length) throw new Error('没有可识别的设置字段')
          patch(picked)
          setImportOpen(false)
          setImportText('')
          setStatus('已导入 ' + Object.keys(picked).length + ' 项，点“保存”后生效')
        } catch (error) {
          setStatus('导入失败：' + error.message)
        }
      }

      const resetDefaults = () => {
        if (!confirmReset) {
          setConfirmReset(true)
          setStatus('再点一次“确认恢复”才会覆盖当前值（尚未保存）')
          return
        }
        setConfirmReset(false)
        patch(defaults)
        setStatus('已恢复默认值，点“保存”后生效')
      }

      const ratio = contrastRatio(settings.text, settings.background)
      const lightBackground = relativeLuminance(settings.background) > 0.5
      const ignored = {
        accentWidth: !isBar,
        progress: !isBar,
        icon: !isBar,
        padX: isDsh,
        padY: isDsh,
      }

      const layoutOptions = [
        { value: 'bar', label: '横条' },
        { value: 'card', label: '卡片' },
        { value: 'dsh', label: 'DSH 原生' },
      ]

      const header = h(
        'div',
        { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' } },
        h(
          'div',
          { style: { minWidth: '260px', flex: '1 1 420px' } },
          h('div', { style: { fontSize: '19px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, '桌面通知'),
          h(
            'div',
            { style: Object.assign({}, hintStyle, { marginTop: '4px' }) },
            'v' + version + ' · BUILD ' + build + ' · 配置保存在 ' + (config.dataDir || '本机数据目录'),
          ),
        ),
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } },
          dirty ? h('span', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, '未保存的改动') : null,
          h('button', { type: 'button', onClick: test, disabled: busy, style: secondaryButton }, '测试通知'),
          h('button', { type: 'button', onClick: save, disabled: busy || !dirty, style: Object.assign({}, primaryButton, { opacity: busy || !dirty ? 0.55 : 1, cursor: busy || !dirty ? 'default' : 'pointer' }) }, busy ? '处理中…' : '保存'),
        ),
      )

      const statusLine = h(
        'div',
        { role: 'status', 'aria-live': 'polite', style: { minHeight: '18px', fontSize: '12.5px', color: 'var(--dsw-alias-label-secondary)' } },
        status,
      )

      const eventsSection = h(
        Section,
        { title: '通知什么', hint: '只为真正需要你注意的事件弹卡片；关闭的事件不弹，但会在“最近通知”里留下记录。' },
        h('div', { style: { display: 'grid', gap: '2px' } },
          events.map((item) =>
            h(Row, { key: item.key, title: item.label, desc: item.desc },
              h(Switch, { checked: Boolean(settings[item.key]), onChange: (value) => patch({ [item.key]: value }) }),
            ),
          ),
        ),
      )

      const behaviorSection = h(
        Section,
        { title: '什么时候不打扰', hint: '抑制只会让卡片不出现，历史里仍保留记录，方便稍后重播。' },
        h(Row, { title: '免打扰时段', desc: '每天固定时段不弹卡片，支持跨午夜' },
          h(Switch, { checked: Boolean(settings.quietEnabled), onChange: (value) => patch({ quietEnabled: value }) }),
        ),
        h(Row, { title: '时段范围', desc: '24 小时制，开始与结束相同视为全天关闭' },
          h('input', {
            type: 'time', value: settings.quietStart, disabled: !settings.quietEnabled,
            'aria-label': '免打扰开始时间',
            onChange: (event) => patch({ quietStart: event.target.value }),
            style: Object.assign({}, inputStyle, { width: '120px' }),
          }),
          h('span', { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: '12px' } }, '至'),
          h('input', {
            type: 'time', value: settings.quietEnd, disabled: !settings.quietEnabled,
            'aria-label': '免打扰结束时间',
            onChange: (event) => patch({ quietEnd: event.target.value }),
            style: Object.assign({}, inputStyle, { width: '120px' }),
          }),
        ),
        h(Row, { title: 'DSH 在前台时不弹', desc: '你正在看 DSH 时不再重复打扰' },
          h(Switch, { checked: Boolean(settings.suppressForeground), onChange: (value) => patch({ suppressForeground: value }) }),
        ),
        h(Row, { title: '全屏 / 演示 / 勿扰时静默', desc: '跟随 Windows 的通知状态，避免覆盖游戏或会议' },
          h(Switch, { checked: Boolean(settings.suppressFullscreen), onChange: (value) => patch({ suppressFullscreen: value }) }),
        ),
        h(Row, { title: '跟随 Windows 专注助手', desc: '专注会话期间只记录不弹窗' },
          h(Switch, { checked: Boolean(settings.respectFocusAssist), onChange: (value) => patch({ respectFocusAssist: value }) }),
        ),
        h(Row, { title: '同时最多显示', desc: '超出时关闭最早的一张，为新的通知让位' },
          h(Slider, {
            title: '同时最多显示', min: 1, max: 5, step: 1, value: settings.maxVisible,
            format: (value) => value + ' 张',
            onChange: (value) => patch({ maxVisible: value }),
          }),
        ),
        h(Row, { title: '显示在哪个屏幕' },
          h(Segmented, {
            label: '显示在哪个屏幕', value: settings.monitor,
            options: [{ value: 'cursor', label: '鼠标所在屏' }, { value: 'primary', label: '主屏' }],
            onChange: (value) => patch({ monitor: value }),
          }),
        ),
        h(Row, { title: '点击卡片', desc: '默认切回 DSH；选“不处理”时只关闭卡片' },
          h(Segmented, {
            label: '点击卡片', value: settings.clickAction,
            options: [{ value: 'focus', label: '切回 DSH' }, { value: 'none', label: '不处理' }],
            onChange: (value) => patch({ clickAction: value }),
          }),
        ),
      )

      const styleSection = h(
        Section,
        { title: '样式', hint: '版式决定信息密度；预设是一组协调好的外观值，可再单独微调。' },
        h(Row, { title: '版式', desc: '横条最轻，卡片信息更多，DSH 原生复刻主界面卡片' },
          h(Segmented, { label: '版式', value: layout, options: layoutOptions, onChange: (value) => patch({ layout: value }) }),
        ),
        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: '8px' } },
          presets.map((preset) =>
            h(PresetCard, { key: preset.id, preset: preset, active: presetActive(preset), onPick: applyPreset }),
          ),
        ),
        h(Row, { title: '停留时长', desc: '到点自动收起；鼠标悬停时暂停，移开继续' },
          h(Slider, {
            title: '停留时长', min: 3, max: 120, step: 1, value: Math.round(settings.durationMs / 1000),
            format: (value) => value + ' 秒',
            onChange: (value) => patch({ durationMs: value * 1000 }),
          }),
          h('div', { style: { display: 'flex', gap: '5px' } },
            [5, 8, 20, 60].map((value) =>
              h(Chip, {
                key: value, active: Math.round(settings.durationMs / 1000) === value,
                onClick: () => patch({ durationMs: value * 1000 }),
              }, value + 's'),
            ),
          ),
        ),
        h(Row, { title: '声音', desc: '使用系统通知音，受 Windows 音量与勿扰控制' },
          h(Switch, { checked: Boolean(settings.sound), onChange: (value) => patch({ sound: value }) }),
        ),
        h(Row, { title: '整体缩放', desc: '高 DPI 屏可放大，预览会同步' },
          h(Slider, {
            title: '整体缩放', min: 0.5, max: 1.5, step: 0.05, value: settings.scale,
            format: (value) => Math.round(value * 100) + '%',
            onChange: (value) => patch({ scale: value }),
          }),
        ),
        h('button', {
          type: 'button',
          onClick: () => setAdvanced((value) => !value),
          'aria-expanded': advanced,
          'aria-controls': 'notify-advanced',
          style: Object.assign({}, secondaryButton, { justifySelf: 'start', padding: '6px 12px', fontSize: '12.5px' }),
        }, advanced ? '收起外观细节' : '展开外观细节'),
        advanced
          ? h('div', { id: 'notify-advanced', style: { display: 'grid', gap: '4px' } },
              h(SubHead, null, '颜色'),
              h(Row, { title: '强调色' }, h(ColorField, { title: '强调色', value: settings.accent, onChange: (value) => patch({ accent: value }) })),
              h(Row, { title: '背景色' }, h(ColorField, { title: '背景色', value: settings.background, onChange: (value) => patch({ background: value }) })),
              h(Row, { title: '文字色' }, h(ColorField, { title: '文字色', value: settings.text, onChange: (value) => patch({ text: value }) })),
              h('div', {
                style: {
                  display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', justifyContent: 'space-between',
                  padding: '8px 10px', borderRadius: '8px',
                  border: '1px solid var(--dsw-alias-border-l1)',
                  background: 'var(--dsw-alias-bg-layer-2)',
                  fontSize: '12px',
                  color: ratio < 4.5 ? 'var(--dsw-alias-label-primary)' : 'var(--dsw-alias-label-secondary)',
                },
              },
                h('span', null, '正文对比度 ' + ratio.toFixed(1) + ':1 · ' + (ratio < 4.5 ? '低于 WCAG AA 4.5:1' : '达到 WCAG AA')),
                ratio < 4.5
                  ? h('button', {
                      type: 'button',
                      onClick: () => patch({ text: lightBackground ? '#111418' : '#ffffff' }),
                      style: Object.assign({}, secondaryButton, { padding: '4px 10px', fontSize: '12px' }),
                    }, lightBackground ? '改为深色文字' : '改为白色文字')
                  : null,
              ),
              h(SubHead, null, '尺寸与位置'),
              h(Row, { title: '卡片宽度', desc: '单位像素，受整体缩放影响' },
                h(Slider, { title: '卡片宽度', min: 240, max: 720, step: 10, value: settings.width, format: (value) => value + ' px', onChange: (value) => patch({ width: value }) })),
              h(Row, { title: '不透明度' },
                h(Slider, { title: '不透明度', min: 0.5, max: 1, step: 0.01, value: settings.opacity, format: (value) => Math.round(value * 100) + '%', onChange: (value) => patch({ opacity: value }) })),
              h(Row, { title: '弹出位置', desc: '相对所选屏幕的角落' },
                h(Segmented, {
                  label: '弹出位置', value: settings.corner,
                  options: [
                    { value: 'tl', label: '左上' }, { value: 'tr', label: '右上' },
                    { value: 'bl', label: '左下' }, { value: 'br', label: '右下' },
                  ],
                  onChange: (value) => patch({ corner: value }),
                })),
              h(Row, { title: '水平边距', desc: '离屏幕左 / 右边缘的距离' },
                h(Slider, { title: '水平边距', min: 0, max: 400, step: 1, value: settings.marginX, format: (value) => value + ' px', onChange: (value) => patch({ marginX: value }) })),
              h(Row, { title: '垂直边距', desc: '离屏幕上 / 下边缘的距离' },
                h(Slider, { title: '垂直边距', min: 0, max: 400, step: 1, value: settings.marginY, format: (value) => value + ' px', onChange: (value) => patch({ marginY: value }) })),
              h(Row, { title: '圆角' },
                h(Slider, { title: '圆角', min: 0, max: 28, step: 1, value: settings.radius, format: (value) => value + ' px', onChange: (value) => patch({ radius: value }) })),
              h(Row, { title: '色条宽度', disabled: ignored.accentWidth, note: ignored.accentWidth ? '仅横条版式使用' : null },
                h(Slider, { title: '色条宽度', min: 0, max: 14, step: 1, value: settings.accentWidth, format: (value) => value + ' px', onChange: (value) => patch({ accentWidth: value }) })),
              h(Row, { title: '水平内边距', disabled: ignored.padX, note: ignored.padX ? 'DSH 原生版式按实测度量，忽略此项' : null },
                h(Slider, { title: '水平内边距', min: 12, max: 40, step: 1, value: settings.padX, format: (value) => value + ' px', onChange: (value) => patch({ padX: value }) })),
              h(Row, { title: '垂直内边距', disabled: ignored.padY, note: ignored.padY ? 'DSH 原生版式按实测度量，忽略此项' : null },
                h(Slider, { title: '垂直内边距', min: 10, max: 32, step: 1, value: settings.padY, format: (value) => value + ' px', onChange: (value) => patch({ padY: value }) })),
              h(SubHead, null, '文字'),
              h(Row, { title: '标题字号', desc: 'DSH 原生会按比例放大' },
                h(Slider, { title: '标题字号', min: 11, max: 22, step: 0.5, value: settings.titleSize, format: (value) => value + ' px', onChange: (value) => patch({ titleSize: value }) })),
              h(Row, { title: '正文字号', desc: 'DSH 原生会按比例放大' },
                h(Slider, { title: '正文字号', min: 10, max: 20, step: 0.5, value: settings.bodySize, format: (value) => value + ' px', onChange: (value) => patch({ bodySize: value }) })),
              h(Row, { title: '字体' },
                h('select', {
                  value: settings.font,
                  'aria-label': '字体',
                  onChange: (event) => patch({ font: event.target.value }),
                  style: Object.assign({}, inputStyle, { width: '220px' }),
                }, fonts.map((font) => h('option', { key: font.value, value: font.value }, font.label))),
              ),
              h(Row, { title: '状态行文案', desc: '留空则显示事件默认文案；DSH 原生显示在底部' },
                h('input', {
                  type: 'text', value: settings.status, maxLength: 40,
                  'aria-label': '状态行文案', placeholder: '例如：本轮完成 · 切回继续',
                  onChange: (event) => patch({ status: event.target.value }),
                  style: Object.assign({}, inputStyle, { width: '100%' }),
                }),
              ),
              h(Row, { title: '应用名', desc: 'DSH 原生版式左上角的一行小字' },
                h('input', {
                  type: 'text', value: settings.eyebrow, maxLength: 16,
                  'aria-label': '应用名', placeholder: 'DeepSeek Harness',
                  onChange: (event) => patch({ eyebrow: event.target.value }),
                  style: Object.assign({}, inputStyle, { width: '100%' }),
                }),
              ),
              h(SubHead, null, '效果与无障碍'),
              h(Row, { title: '投影强度' },
                h(Slider, { title: '投影强度', min: 0, max: 1, step: 0.01, value: settings.shadow, format: (value) => Math.round(value * 100) + '%', onChange: (value) => patch({ shadow: value }) })),
              h(Row, { title: '高光', desc: '横条顶部的一层柔光' },
                h(Slider, { title: '高光', min: 0, max: 0.3, step: 0.01, value: settings.shine, format: (value) => Math.round(value * 100) + '%', onChange: (value) => patch({ shine: value }) })),
              h(Row, { title: '底部进度条', disabled: ignored.progress, note: ignored.progress ? '仅横条版式使用' : null },
                h(Switch, { checked: Boolean(settings.progress), onChange: (value) => patch({ progress: value }) })),
              h(Row, { title: '图标', disabled: ignored.icon, note: ignored.icon ? '仅横条版式使用' : null },
                h(Switch, { checked: Boolean(settings.icon), onChange: (value) => patch({ icon: value }) })),
              h(Row, { title: '淡入淡出', desc: '跟随系统“减少动画”时自动关闭' },
                h(Switch, { checked: Boolean(settings.fade), onChange: (value) => patch({ fade: value }) })),
              h(Row, { title: '减少动画' },
                h(Switch, { checked: Boolean(settings.reduceMotion), onChange: (value) => patch({ reduceMotion: value }) })),
              h(Row, { title: '高对比模式', desc: '使用系统高对比配色，忽略自定义颜色' },
                h(Switch, { checked: Boolean(settings.highContrast), onChange: (value) => patch({ highContrast: value }) })),
              h(Row, { title: '按事件语义着色', desc: '不同事件使用不同强调色' },
                h(Switch, { checked: Boolean(settings.semanticColor), onChange: (value) => patch({ semanticColor: value }) })),
            )
          : null,
      )

      const historySection = h(
        Section,
        { title: '最近通知', hint: '最多保留 50 条，这里显示最近 30 条；被抑制的记录也会保留原因，便于排查“为什么没弹”。' },
        h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '8px' } },
          h('button', { type: 'button', onClick: loadHistory, style: Object.assign({}, secondaryButton, { padding: '5px 10px', fontSize: '12px' }) }, '刷新'),
          h('button', { type: 'button', onClick: clearHistory, style: Object.assign({}, secondaryButton, { padding: '5px 10px', fontSize: '12px' }) }, confirmClear ? '确认清空' : '清空历史'),
        ),
        history.length === 0
          ? h('div', { style: hintStyle }, '还没有记录。点“测试通知”，或等一次真实事件。')
          : h('div', { style: { display: 'grid', gap: '6px', maxHeight: '330px', overflow: 'auto', paddingRight: '4px' } },
              history.slice(0, 30).map((entry) =>
                h('div', {
                  key: entry.id,
                  style: {
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px',
                    padding: '8px 10px', borderRadius: '8px',
                    border: '1px solid var(--dsw-alias-border-l1)',
                    background: 'var(--dsw-alias-bg-layer-2)',
                  },
                },
                  h('div', { style: { minWidth: 0 } },
                    h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' } },
                      h('span', { style: { fontSize: '12px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, EVENT_LABELS[entry.event] || entry.event),
                      entry.suppressed
                        ? h('span', {
                            style: {
                              fontSize: '10.5px', padding: '1px 6px', borderRadius: '999px',
                              border: '1px solid var(--dsw-alias-border-l1)',
                              color: 'var(--dsw-alias-label-secondary)',
                            },
                          }, '未显示 · ' + (SUPPRESS_LABELS[entry.suppressed] || entry.suppressed))
                        : null,
                      h('span', { style: { fontSize: '11px', color: 'var(--dsw-alias-label-secondary)' } }, formatDate(entry.at) + ' ' + formatClock(entry.at)),
                    ),
                    h('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-primary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, entry.title || entry.body || '（无标题）'),
                  ),
                  h('button', {
                    type: 'button',
                    onClick: () => replay(entry.id),
                    style: Object.assign({}, secondaryButton, { padding: '3px 9px', fontSize: '11.5px', flex: '0 0 auto' }),
                  }, '重播'),
                ),
              ),
            ),
      )

      const dataSection = h(
        Section,
        { title: '数据与维护', hint: '设置保存在你的用户目录，升级或重装插件不会覆盖。' },
        h(SummaryLine, { label: '配置目录', value: config.dataDir || '—' }),
        h(SummaryLine, { label: '配置来源', value: config.loadedFrom === 'migrated' ? '已从旧版迁移' : config.loadedFrom === 'package' ? '插件包内旧配置' : '用户配置' }),
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' } },
          h('button', { type: 'button', onClick: exportSettings, style: secondaryButton }, '导出设置'),
          h('button', { type: 'button', onClick: () => setImportOpen((value) => !value), 'aria-expanded': importOpen, style: secondaryButton }, importOpen ? '取消导入' : '导入设置'),
          h('button', { type: 'button', onClick: resetDefaults, style: secondaryButton }, confirmReset ? '确认恢复默认' : '恢复默认'),
        ),
        importOpen
          ? h('div', { style: { display: 'grid', gap: '8px' } },
              h('textarea', {
                value: importText,
                'aria-label': '粘贴设置 JSON',
                placeholder: '粘贴导出的 JSON 内容',
                onChange: (event) => setImportText(event.target.value),
                rows: 5,
                style: Object.assign({}, inputStyle, { fontFamily: 'monospace', resize: 'vertical' }),
              }),
              h('button', { type: 'button', onClick: applyImport, style: Object.assign({}, primaryButton, { justifySelf: 'start' }) }, '应用导入内容'),
            )
          : null,
      )

      const preview = h(
        Section,
        { title: '实时预览', hint: '按当前值渲染，未保存也会立即变化。' },
        h('div', {
          role: 'img',
          'aria-label': '通知预览：' + (LAYOUT_LABELS[layout] || layout) + ' 版式，停留 ' + formatSeconds(settings.durationMs),
        }, h(ToastPreview, { settings: settings })),
        h('div', { style: { display: 'grid', gap: '6px' } },
          h(SummaryLine, { label: '版式', value: LAYOUT_LABELS[layout] || layout }),
          h(SummaryLine, { label: '停留', value: formatSeconds(settings.durationMs) }),
          h(SummaryLine, { label: '最多同屏', value: settings.maxVisible + ' 张' }),
          h(SummaryLine, { label: '免打扰', value: settings.quietEnabled ? settings.quietStart + '–' + settings.quietEnd : '关闭' }),
          h(SummaryLine, { label: '点击', value: settings.clickAction === 'focus' ? '切回 DSH' : '只关闭' }),
        ),
        h('button', { type: 'button', onClick: test, disabled: busy, style: Object.assign({}, primaryButton, { opacity: busy ? 0.6 : 1 }) }, '用当前值测试'),
      )

      return h(
        'div',
        { style: { maxWidth: '1100px', margin: '0 auto', padding: '8px 24px 56px', display: 'grid', gap: '14px' } },
        header,
        statusLine,
        h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '18px' } },
          h('div', { style: { flex: '1 1 560px', minWidth: '0', display: 'grid', gap: '14px' } },
            eventsSection,
            behaviorSection,
            styleSection,
            historySection,
            dataSection,
          ),
          h('div', { style: { flex: '0 1 360px', minWidth: '290px', position: 'sticky', top: '16px', display: 'grid', gap: '14px' } },
            preview,
          ),
        ),
      )
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            { name: 'settings.section', id: 'desktop-notify', order: 30, label: '桌面通知' },
            SettingsPage,
          ),
        )
      },
    }
  },
})