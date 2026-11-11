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
        name: 'DSH 原生',
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

    function SettingsPage() {
      const [settings, setSettings] = React.useState(null)
      const [saved, setSaved] = React.useState(null)
      const [status, setStatus] = React.useState('')
      const [busy, setBusy] = React.useState(false)

      React.useEffect(() => {
        let alive = true
        fetch(ENDPOINT, { cache: 'no-store' })
          .then((response) => response.json())
          .then((data) => {
            if (alive) {
              setSettings(data)
              setSaved(data)
            }
          })
          .catch(() => {
            if (alive) setStatus('读取设置失败，请刷新页面重试')
          })
        return () => {
          alive = false
        }
      }, [])

      if (!settings) {
        return h(
          'div',
          { style: { padding: '24px', color: 'var(--dsw-alias-label-secondary)', fontSize: '13px' } },
          status || '加载中…',
        )
      }

      const patch = (next) => setSettings(Object.assign({}, settings, next))
      const dirty = saved ? JSON.stringify(saved) !== JSON.stringify(settings) : false

      const post = async (payload) => {
        setBusy(true)
        try {
          const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (!response.ok) throw new Error('HTTP ' + response.status)
          const data = await response.json()
          if (payload.action === 'test') {
            setStatus('已按页面上的当前值弹出测试通知。')
          } else {
            setSettings(data)
            setSaved(data)
            setStatus('已保存，新的通知样式立即生效，不用重启 DSH。')
          }
        } catch (error) {
          setStatus('操作失败：' + String(error))
        } finally {
          setBusy(false)
        }
      }

      const save = () => post({ action: 'save', settings })
      const test = () => post({ action: 'test', settings })

      const isActivePreset = (preset) =>
        Object.keys(preset.values).every((key) => Number(settings[key]) === Number(preset.values[key]) || settings[key] === preset.values[key])

      const pickPreset = (preset) => {
        patch(preset.values)
        setStatus('已套用「' + preset.name + '」，点“保存”后生效。')
      }

      const layoutKind = settings.layout || 'bar'
      const showsCardExtras = layoutKind === 'card' || layoutKind === 'dsh'
      const isDshLayout = layoutKind === 'dsh'

      return h(
        'div',
        { style: page },
        h(
          'div',
          { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' } },
          h(
            'div',
            null,
            h('div', { style: { color: 'var(--dsw-alias-label-primary)', fontSize: '17px', fontWeight: 600 } }, '桌面通知'),
            h(
              'div',
              { style: Object.assign({}, hintStyle, { marginTop: '6px' }) },
              '会话完成、需要你回答或确认时，在鼠标所在显示器的角落弹一张卡片。先选一套样式，再按需要微调。',
            ),
          ),
          h(
            'div',
            { style: { display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 } },
            h('button', { type: 'button', style: primaryButton, disabled: busy, onClick: save }, dirty ? '保存修改' : '保存'),
            h('button', { type: 'button', style: secondaryButton, disabled: busy, onClick: test }, '测试通知'),
          ),
        ),
        h(
          'div',
          { style: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', minHeight: '18px' } },
          status ? h('span', { role: 'status', style: hintStyle }, status) : null,
          dirty ? h('span', { style: { color: 'var(--dsw-alias-brand-primary)', fontSize: '12px', fontWeight: 600 } }, '● 有未保存的修改') : null,
        ),
        h(
          Section,
          { title: '快速样式', hint: '会同时改颜色、圆角和弹出位置；选中后还能继续微调。' },
          h(
            'div',
            { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: '10px' } },
            PRESETS.map((preset) =>
              h(PresetCard, {
                key: preset.id,
                preset: preset,
                active: isActivePreset(preset),
                onPick: pickPreset,
              }),
            ),
          ),
        ),
        h(
          Section,
          { title: '布局', hint: '条状是轻量的一行提示；卡片版式带图标和多层文字；DSH 原生是白色大卡。' },
          h(Field, { title: '版式' },
            h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
              [
                { id: 'bar', name: '条状', desc: '一行标题加正文' },
                { id: 'card', name: '卡片', desc: '图标 + 多行文字' },
                { id: 'dsh', name: 'DSH 原生', desc: '白底大卡 + 应用名' },
              ].map((item) =>
                h('button', {
                  key: item.id,
                  type: 'button',
                  'aria-pressed': (settings.layout || 'bar') === item.id,
                  onClick: () => patch({ layout: item.id }),
                  style: Object.assign(
                    {},
                    (settings.layout || 'bar') === item.id ? primaryButton : secondaryButton,
                    { display: 'grid', gap: '2px', textAlign: 'left', padding: '8px 14px' },
                  ),
                },
                  h('span', { style: { fontSize: '13px', fontWeight: 600 } }, item.name),
                  h('span', { style: { fontSize: '11.5px', opacity: 0.72 } }, item.desc),
                ),
              ),
            )),
          showsCardExtras
            ? h(Field, { title: '状态行文案', desc: isDshLayout ? '卡片底部红点后面那行小字；留空显示倒计时' : '卡片底部那行小字；留空会按通知类型自动选' },
                h('input', {
                  type: 'text',
                  value: settings.status || '',
                  placeholder: isDshLayout ? '秒后收起 · 悬停可保留' : '点击卡片切回会话',
                  maxLength: 40,
                  onChange: (event) => patch({ status: event.target.value }),
                  style: Object.assign({}, inputStyle, { width: '260px' }),
                }))
            : null,
          showsCardExtras
            ? h(Field, {
                title: isDshLayout ? '应用名' : '小标题文字',
                desc: isDshLayout ? '图标右侧那行应用名，留空为 DeepSeek Harness' : '标题上方那行大写小字，默认取标题里的 DSH',
              },
                h('input', {
                  type: 'text',
                  value: settings.eyebrow || '',
                  placeholder: isDshLayout ? 'DeepSeek Harness' : 'DSH',
                  maxLength: 16,
                  onChange: (event) => patch({ eyebrow: event.target.value }),
                  style: Object.assign({}, inputStyle, { width: isDshLayout ? '200px' : '160px' }),
                }))
            : null,
        ),
        h(
          Section,
          { title: '实时预览', hint: '跟着下面的设置即时变化；预览按比例缩放（放大超过 100% 时只画到原始尺寸），真实卡片以弹窗为准。' },
          h(ToastPreview, { settings: settings }),
          h(
            'div',
            { style: hintStyle },
            Math.round(settings.durationMs / 1000) +
              ' 秒后自动消失 · ' +
              (settings.sound ? '有提示音' : '静音') +
              ' · 宽 ' +
              Math.round(num(settings.width, 400)) +
              ' 像素 · 圆角 ' +
              Math.round(num(settings.radius, 12)) +
              ' 像素 · 缩放 ' +
              Math.round(num(settings.scale, 1) * 100) +
              '%',
          ),
        ),
        h(
          Section,
          { title: '颜色与大小' },
          h(Field, { title: '左侧色条', desc: '卡片左边那条竖线，用来区分提醒类型' },
            h(ColorField, {
              title: '左侧色条',
              value: settings.accent,
              onChange: (value) => patch({ accent: value }),
            })),
          h(Field, { title: '卡片底色', desc: '浅色底会自动换成深色小字' },
            h(ColorField, {
              title: '卡片底色',
              value: settings.background,
              onChange: (value) => patch({ background: value }),
            })),
          h(Field, { title: '文字颜色', desc: '标题和正文的颜色' },
            h(ColorField, {
              title: '文字颜色',
              value: settings.text,
              onChange: (value) => patch({ text: value }),
            })),
          h(Field, { title: '卡片宽度', desc: '240 – 720 像素，越宽字越舒展' },
            h(Slider, {
              title: '卡片宽度',
              min: 240,
              max: 720,
              step: 10,
              value: num(settings.width, 400),
              format: (value) => Math.round(value) + 'px',
              onChange: (value) => patch({ width: value }),
            })),
          h(Field, { title: '整体缩放', desc: '50% – 150%：连同字号、图标、间距一起等比缩放，100% 为原始大小' },
            h(Slider, {
              title: '整体缩放',
              min: 0.5,
              max: 1.5,
              step: 0.05,
              value: num(settings.scale, 1),
              format: (value) => Math.round(value * 100) + '%',
              onChange: (value) => patch({ scale: value }),
            })),
          h(Field, { title: '透明度', desc: '0.5 半透明，1 完全不透明' },
            h(Slider, {
              title: '透明度',
              min: 0.5,
              max: 1,
              step: 0.01,
              value: num(settings.opacity, 1),
              format: (value) => Number(value).toFixed(2),
              onChange: (value) => patch({ opacity: value }),
            })),
        ),
        h(
          Section,
          { title: '形状与排版', hint: '圆角、内边距和字号决定卡片的手感。' },
          h(Field, { title: '圆角', desc: '0 是直角，18 以上接近胶囊' },
            h(Slider, {
              title: '圆角',
              min: 0,
              max: 28,
              step: 1,
              value: num(settings.radius, 12),
              format: (value) => Math.round(value) + 'px',
              onChange: (value) => patch({ radius: value }),
            })),
          h(Field, { title: '色条宽度', desc: '左侧强调条的粗细，0 表示不要' },
            h(Slider, {
              title: '色条宽度',
              min: 0,
              max: 14,
              step: 1,
              value: num(settings.accentWidth, 4),
              format: (value) => Math.round(value) + 'px',
              onChange: (value) => patch({ accentWidth: value }),
            })),
          h(Field, { title: '水平内边距', desc: '文字离卡片左右边缘的距离' },
            h(Slider, {
              title: '水平内边距',
              min: 12,
              max: 40,
              step: 1,
              value: num(settings.padX, 20),
              format: (value) => Math.round(value) + 'px',
              onChange: (value) => patch({ padX: value }),
            })),
          h(Field, { title: '垂直内边距', desc: '文字离卡片上下边缘的距离' },
            h(Slider, {
              title: '垂直内边距',
              min: 10,
              max: 32,
              step: 1,
              value: num(settings.padY, 16),
              format: (value) => Math.round(value) + 'px',
              onChange: (value) => patch({ padY: value }),
            })),
          h(Field, { title: '标题字号', desc: '11 – 22 像素' },
            h(Slider, {
              title: '标题字号',
              min: 11,
              max: 22,
              step: 0.5,
              value: num(settings.titleSize, 15),
              format: (value) => Number(value).toFixed(1) + 'px',
              onChange: (value) => patch({ titleSize: value }),
            })),
          h(Field, { title: '正文字号', desc: '10 – 20 像素' },
            h(Slider, {
              title: '正文字号',
              min: 10,
              max: 20,
              step: 0.5,
              value: num(settings.bodySize, 13),
              format: (value) => Number(value).toFixed(1) + 'px',
              onChange: (value) => patch({ bodySize: value }),
            })),
          h(Field, { title: '字体', desc: '系统里已安装的字体名' },
            h('select', {
              value: FONTS.some((item) => item.value === settings.font) ? settings.font : FONTS[0].value,
              onChange: (event) => patch({ font: event.target.value }),
              style: Object.assign({}, inputStyle, { width: '220px' }),
            },
              FONTS.map((item) => h('option', { key: item.value, value: item.value }, item.label)),
            )),
        ),
        h(
          Section,
          { title: '质感', hint: '投影和高光让卡片浮起来，太强会显得脏。' },
          h(Field, { title: '投影强度', desc: '0 没有阴影，1 阴影最重' },
            h(Slider, {
              title: '投影强度',
              min: 0,
              max: 1,
              step: 0.01,
              value: num(settings.shadow, 0.45),
              format: (value) => Number(value).toFixed(2),
              onChange: (value) => patch({ shadow: value }),
            })),
          h(Field, { title: '顶部高光', desc: '卡片上沿的一层极淡反光' },
            h(Slider, {
              title: '顶部高光',
              min: 0,
              max: 0.3,
              step: 0.01,
              value: num(settings.shine, 0.05),
              format: (value) => Number(value).toFixed(2),
              onChange: (value) => patch({ shine: value }),
            })),
          h(Field, { title: '底部进度条', desc: '随着停留时间缩短，像一个倒计时' },
            h(Switch, {
              title: '底部进度条',
              checked: settings.progress !== false,
              onChange: (value) => patch({ progress: value }),
            })),
          h(Field, { title: '标题圆点', desc: '标题左侧的小圆点，用强调色' },
            h(Switch, {
              title: '标题圆点',
              checked: settings.icon !== false,
              onChange: (value) => patch({ icon: value }),
            })),
          h(Field, { title: '淡入淡出', desc: '弹出和消失时带一点过渡' },
            h(Switch, {
              title: '淡入淡出',
              checked: settings.fade !== false,
              onChange: (value) => patch({ fade: value }),
            })),
        ),
        h(
          Section,
          { title: '弹出与停留' },
          h(Field, { title: '显示多久', desc: '3 – 120 秒；鼠标移上去会暂停计时' },
            h(Slider, {
              title: '显示多久',
              min: 3,
              max: 120,
              step: 1,
              value: Math.round(num(settings.durationMs, 20000) / 1000),
              format: (value) => Math.round(value) + ' 秒',
              onChange: (value) => patch({ durationMs: value * 1000 }),
            })),
          h(Field, { title: '弹出位置', desc: '相对鼠标所在显示器的角' },
            h('select', {
              value: settings.corner,
              onChange: (event) => patch({ corner: event.target.value }),
              style: Object.assign({}, inputStyle, { width: '180px' }),
            },
              h('option', { value: 'br' }, '右下角'),
              h('option', { value: 'bl' }, '左下角'),
              h('option', { value: 'tr' }, '右上角'),
              h('option', { value: 'tl' }, '左上角'),
            )),
          h(Field, { title: '离屏幕边缘', desc: '边距越大，卡片离屏幕角越远' },
            h('div', { style: { display: 'flex', gap: '10px', alignItems: 'center' } },
              h(Slider, {
                title: '水平边距',
                min: 0,
                max: 400,
                step: 1,
                value: num(settings.marginX, 16),
                format: (value) => Math.round(value) + 'px',
                onChange: (value) => patch({ marginX: value }),
              }),
              h('span', { style: hintStyle }, '水平'))),
          h(Field, { title: '垂直边距', desc: '离屏幕上下的距离' },
            h(Slider, {
              title: '垂直边距',
              min: 0,
              max: 400,
              step: 1,
              value: num(settings.marginY, 16),
              format: (value) => Math.round(value) + 'px',
              onChange: (value) => patch({ marginY: value }),
            })),
          h(Field, { title: '提示音', desc: '弹出时响一声，开会时可以关掉' },
            h(Switch, {
              title: '提示音',
              checked: Boolean(settings.sound),
              onChange: (value) => patch({ sound: value }),
            })),
        ),
        h(
          'div',
          { style: hintStyle },
          '保存立即生效，不用重启 DSH；测试通知用页面上的当前值，可以先试再保存。',
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
