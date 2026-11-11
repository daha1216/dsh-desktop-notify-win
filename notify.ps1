param([switch]$Quiet, [switch]$Diagnose, [string]$Snapshot = '', [switch]$Serve)

$ErrorActionPreference = 'Stop'

$title = if ($env:DSH_NOTIFY_TITLE) { $env:DSH_NOTIFY_TITLE } else { 'DeepSeek Harness' }
$body = if ($env:DSH_NOTIFY_BODY) { $env:DSH_NOTIFY_BODY } else { '' }
$timeoutMs = 20000
if ($env:DSH_NOTIFY_MS) { [int]::TryParse($env:DSH_NOTIFY_MS, [ref]$timeoutMs) | Out-Null }
$logPath = if ($env:DSH_NOTIFY_LOG) { $env:DSH_NOTIFY_LOG } else { Join-Path $env:TEMP 'dsh-notify-click.log' }

Add-Type -ReferencedAssemblies System.Windows.Forms, System.Drawing, System.Web.Extensions -TypeDefinition @'
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Drawing.Text;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;

public class DshActions
{
    [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
    [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] static extern bool BringWindowToTop(IntPtr h);
    [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
    [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr h, int cmd);
    [DllImport("user32.dll")] static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
    [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc cb, IntPtr lp);
    [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
    [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] static extern int GetWindowThreadProcessId(IntPtr h, IntPtr pid);
    [DllImport("user32.dll")] static extern int GetWindowThreadProcessId(IntPtr h, out int pid);
    [DllImport("user32.dll")] static extern int GetClassName(IntPtr h, StringBuilder sb, int max);
    [DllImport("user32.dll")] static extern int GetWindowText(IntPtr h, StringBuilder sb, int max);
    [DllImport("user32.dll")] static extern bool AttachThreadInput(int idAttach, int idAttachTo, bool fAttach);
    [DllImport("kernel32.dll")] static extern int GetCurrentThreadId();
    [DllImport("user32.dll")] static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint flags);

    public delegate bool EnumProc(IntPtr h, IntPtr lp);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left, Top, Right, Bottom; }

    [ComImport, Guid("A5CD92FF-29BE-454C-8D04-D82879FB3F1B"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IVirtualDesktopManager
    {
        [return: MarshalAs(UnmanagedType.Bool)]
        bool IsWindowOnCurrentVirtualDesktop(IntPtr topLevelWindow);
        Guid GetWindowDesktopId(IntPtr topLevelWindow);
        void MoveWindowToDesktop(IntPtr topLevelWindow, ref Guid desktopId);
    }

    [ComImport, Guid("AA509086-5CA9-4C25-8F95-589D3C07B48A")]
    class VirtualDesktopManagerClass { }

    [ComImport, Guid("6D5140C1-7436-11CE-8034-00AA006009FA"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IServiceProvider { void QueryService(ref Guid service, ref Guid riid, out IntPtr ppv); }

    [ComImport, Guid("C2F03A33-21F5-47FA-B4BB-156362A2F239")]
    class ImmersiveShell { }

    [ComImport, Guid("3F07F4BE-B107-441A-AF0F-39D82529072C"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IVirtualDesktop
    {
        bool IsViewVisible(IntPtr view);
        Guid GetId();
    }

    [ComImport, Guid("92CA9DCD-5622-4bba-A805-5E9F541BD8C9"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IObjectArray
    {
        uint GetCount();
        void GetAt(uint index, ref Guid riid, [MarshalAs(UnmanagedType.Interface)] out object ppv);
    }

    // Vtable order matters: GetCount, MoveViewToDesktop, CanViewMoveDesktops,
    // GetCurrentDesktop, GetDesktops, GetAdjacentDesktop, SwitchDesktop.
    [ComImport, Guid("53F5CA0B-158F-4124-900C-057158060B27"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IVirtualDesktopManagerInternal
    {
        int GetCount();
        void MoveViewToDesktop(IntPtr view, IVirtualDesktop desktop);
        bool CanViewMoveDesktops(IntPtr view);
        IVirtualDesktop GetCurrentDesktop();
        void GetDesktops(out IObjectArray desktops);
        [PreserveSig] int GetAdjacentDesktop(IVirtualDesktop from, int direction, out IVirtualDesktop desktop);
        void SwitchDesktop(IVirtualDesktop desktop);
    }

    public static string LogPath = "";

    public static void Log(string message)
    {
        try
        {
            if (String.IsNullOrEmpty(LogPath)) return;
            System.IO.File.AppendAllText(LogPath, DateTime.Now.ToString("o") + " " + message + Environment.NewLine);
        }
        catch { }
    }

    public static void KeepTop(IntPtr h)
    {
        try { SetWindowPos(h, new IntPtr(-1), 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0010); } catch { }
    }

    // Older builds marked the DSH window HWND_TOPMOST and never cleared it.
    // Only a process at the same integrity level can undo that, which is why
    // this runs from the popup (spawned by the host) rather than from the agent shell.
    public static void ClearTopmost()
    {
        try
        {
            IntPtr t = FindDshWindow(Process.GetCurrentProcess().Id);
            if (t != IntPtr.Zero)
                SetWindowPos(t, new IntPtr(-2), 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0010);
        }
        catch { }
    }

    static IVirtualDesktopManager Vdm()
    {
        return (IVirtualDesktopManager)new VirtualDesktopManagerClass();
    }

    static string ProcName(int pid)
    {
        try { return Process.GetProcessById(pid).ProcessName; } catch { return "?"; }
    }

    static long Area(IntPtr h)
    {
        RECT r;
        if (!GetWindowRect(h, out r)) return 0;
        return (long)(r.Right - r.Left) * (r.Bottom - r.Top);
    }

    public static string[] DumpWindows()
    {
        var lines = new List<string>();
        EnumWindows((h, lp) =>
        {
            if (!IsWindowVisible(h)) return true;
            int pid;
            GetWindowThreadProcessId(h, out pid);
            long area = Area(h);
            if (area < 100 * 100) return true;
            var sb = new StringBuilder(256);
            GetClassName(h, sb, 256);
            var tb = new StringBuilder(256);
            GetWindowText(h, tb, 256);
            lines.Add("win hwnd=" + h + " pid=" + pid + " proc=" + ProcName(pid) + " class=" + sb + " title=" + tb + " area=" + area);
            return true;
        }, IntPtr.Zero);
        return lines.ToArray();
    }

    public static IntPtr FindDshWindow(int selfPid)
    {
        IntPtr best = IntPtr.Zero;
        long bestScore = 0;
        long bestArea = 0;
        EnumWindows((h, lp) =>
        {
            if (!IsWindowVisible(h)) return true;
            int pid;
            GetWindowThreadProcessId(h, out pid);
            if (pid == 0 || pid == selfPid) return true;
            string name = ProcName(pid);
            var sb = new StringBuilder(256);
            GetClassName(h, sb, 256);
            string cls = sb.ToString();
            var tb = new StringBuilder(256);
            GetWindowText(h, tb, 256);
            string title = tb.ToString();
            long area = Area(h);
            if (area < 200 * 200) return true;

            long score = 0;
            if (title.IndexOf("deepseek", StringComparison.OrdinalIgnoreCase) >= 0) score += 5;
            if (title.IndexOf("harness", StringComparison.OrdinalIgnoreCase) >= 0) score += 4;
            if (title.IndexOf("dsh", StringComparison.OrdinalIgnoreCase) >= 0) score += 2;
            if (cls.IndexOf("Chrome_WidgetWin", StringComparison.OrdinalIgnoreCase) >= 0) score += 1;
            if (name.IndexOf("deepseek", StringComparison.OrdinalIgnoreCase) >= 0) score += 3;
            if (score == 0) return true;

            Log("candidate hwnd=" + h + " proc=" + name + " class=" + cls + " title=" + title + " area=" + area + " score=" + score);
            if (score > bestScore || (score == bestScore && area > bestArea))
            {
                bestScore = score;
                bestArea = area;
                best = h;
            }
            return true;
        }, IntPtr.Zero);
        return best;
    }

    static void Chord(byte vk)
    {
        keybd_event(0x5B, 0, 0, UIntPtr.Zero);
        keybd_event(0x11, 0, 0, UIntPtr.Zero);
        keybd_event(vk, 0, 0, UIntPtr.Zero);
        keybd_event(vk, 0, 2, UIntPtr.Zero);
        keybd_event(0x11, 0, 2, UIntPtr.Zero);
        keybd_event(0x5B, 0, 2, UIntPtr.Zero);
        Thread.Sleep(450);
    }

    static bool OnCurrent(IVirtualDesktopManager vdm, IntPtr h)
    {
        try { return vdm.IsWindowOnCurrentVirtualDesktop(h); } catch { return true; }
    }

    static IVirtualDesktopManagerInternal Manager()
    {
        var sp = (IServiceProvider)new ImmersiveShell();
        var svc = new Guid("C5E0CDCA-7B6E-41B2-9FC4-D93975CC467B");
        var riid = new Guid("53F5CA0B-158F-4124-900C-057158060B27");
        IntPtr p;
        sp.QueryService(ref svc, ref riid, out p);
        return (IVirtualDesktopManagerInternal)Marshal.GetObjectForIUnknown(p);
    }

    static bool DirectSwitch(Guid targetDesktop)
    {
        try
        {
            var mgr = Manager();
            IObjectArray arr;
            mgr.GetDesktops(out arr);
            uint n = arr.GetCount();
            var iid = new Guid("3F07F4BE-B107-441A-AF0F-39D82529072C");
            for (uint i = 0; i < n; i++)
            {
                object o;
                arr.GetAt(i, ref iid, out o);
                var d = (IVirtualDesktop)o;
                if (d.GetId() == targetDesktop)
                {
                    mgr.SwitchDesktop(d);
                    Log("com-switch ok index=" + i);
                    return true;
                }
            }
            Log("com-desktop-not-found count=" + n);
        }
        catch (Exception e)
        {
            Log("com-failed " + e.GetType().Name + " " + e.Message);
        }
        return false;
    }

    public static string FocusDsh(IntPtr self)
    {
        Log("clicked; foreground=" + GetForegroundWindow());
        IntPtr target = FindDshWindow(Process.GetCurrentProcess().Id);
        if (target == IntPtr.Zero) { Log("no-dsh-window"); return "no-dsh-window"; }

        var vdm = Vdm();
        bool onCurrent = OnCurrent(vdm, target);
        Log("target=" + target + " onCurrent=" + onCurrent);

        bool switched = onCurrent;
        if (!onCurrent)
        {
            try
            {
                Guid targetDesktop = vdm.GetWindowDesktopId(target);
                switched = DirectSwitch(targetDesktop);
            }
            catch (Exception e) { Log("desktop-id-failed " + e.Message); }
        }
        if (!switched)
        {
            try
            {
                Guid current = vdm.GetWindowDesktopId(self);
                vdm.MoveWindowToDesktop(target, ref current);
                switched = true;
                Log("moved-window-to-current");
            }
            catch (Exception e) { Log("move-failed " + e.Message); }
        }

        // Only un-minimize. Never SW_RESTORE a normal/maximized window.
        if (IsIconic(target)) ShowWindow(target, 9);
        // Clean up any stale always-on-top left by older builds; keep size/position.
        SetWindowPos(target, new IntPtr(-2), 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0010);

        int targetThread = GetWindowThreadProcessId(target, IntPtr.Zero);
        int selfThread = GetCurrentThreadId();
        AttachThreadInput(selfThread, targetThread, true);
        bool ok = SetForegroundWindow(target);
        BringWindowToTop(target);
        AttachThreadInput(selfThread, targetThread, false);
        Log("setForeground=" + ok + " finalForeground=" + GetForegroundWindow());
        return switched ? "switched" : "focus-only";
    }

    [DllImport("shell32.dll")] static extern int SHQueryUserNotificationState(out int state);

    public static int NotificationState()
    {
        try { int state; return SHQueryUserNotificationState(out state) == 0 ? state : 5; }
        catch { return 5; }
    }

    public static bool IsDshForeground()
    {
        try
        {
            IntPtr h = GetForegroundWindow();
            if (h == IntPtr.Zero) return false;
            int pid;
            GetWindowThreadProcessId(h, out pid);
            string name = ProcName(pid).ToLowerInvariant();
            return name.Contains("deepseek") || name.Contains("harness") || name.Contains("dsh");
        }
        catch { return false; }
    }
}

public static class DshDpi
{
    [StructLayout(LayoutKind.Sequential)]
    public struct DpiPoint { public int X; public int Y; }

    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] static extern IntPtr SetProcessDpiAwarenessContext(IntPtr value);
    [DllImport("shcore.dll")] static extern int SetProcessDpiAwareness(int value);
    [DllImport("user32.dll")] static extern IntPtr MonitorFromPoint(DpiPoint pt, uint flags);
    [DllImport("shcore.dll")] static extern int GetDpiForMonitor(IntPtr monitor, int dpiType, out uint dpiX, out uint dpiY);
    [DllImport("gdi32.dll")] static extern IntPtr GetDC(IntPtr hWnd);
    [DllImport("user32.dll")] static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);
    [DllImport("gdi32.dll")] static extern int GetDeviceCaps(IntPtr hdc, int index);

    // Per-Monitor V2 keeps the card crisp when the cursor sits on a mixed-DPI
    // secondary monitor; the older system-aware mode gets bitmap-stretched by DWM.
    public static void EnablePerMonitorV2()
    {
        try { if (SetProcessDpiAwarenessContext(new IntPtr(-4)) != IntPtr.Zero) return; } catch { }
        try { if (SetProcessDpiAwareness(2) == 0) return; } catch { }
        try { SetProcessDPIAware(); } catch { }
    }

    public static double ScaleFor(Screen screen)
    {
        try
        {
            Rectangle b = screen.Bounds;
            IntPtr monitor = MonitorFromPoint(new DpiPoint { X = b.Left + b.Width / 2, Y = b.Top + b.Height / 2 }, 2);
            uint dx, dy;
            if (monitor != IntPtr.Zero && GetDpiForMonitor(monitor, 0, out dx, out dy) == 0 && dx >= 72 && dx <= 480)
                return dx / 96.0;
        }
        catch { }
        try
        {
            IntPtr dc = GetDC(IntPtr.Zero);
            int dpi = GetDeviceCaps(dc, 88);
            ReleaseDC(IntPtr.Zero, dc);
            if (dpi >= 72 && dpi <= 480) return dpi / 96.0;
        }
        catch { }
        return 1.0;
    }
}

// Per-pixel-alpha card. WinForms lays out child controls with hard edges and no
// true shadow, so the whole card is composed into a 32bpp premultiplied bitmap
// and pushed through UpdateLayeredWindow instead.
public class DshToast : Form
{
    const int ULW_ALPHA = 2;

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    struct BLENDFUNCTION { public byte BlendOp; public byte BlendFlags; public byte SourceConstantAlpha; public byte AlphaFormat; }

    [StructLayout(LayoutKind.Sequential)]
    struct POINT { public int X; public int Y; }

    [StructLayout(LayoutKind.Sequential)]
    struct SIZE { public int cx; public int cy; }

    [StructLayout(LayoutKind.Sequential)]
    struct BITMAPINFOHEADER
    {
        public uint biSize; public int biWidth; public int biHeight;
        public ushort biPlanes; public ushort biBitCount; public uint biCompression;
        public uint biSizeImage; public int biXPelsPerMeter; public int biYPelsPerMeter;
        public uint biClrUsed; public uint biClrImportant;
    }

    [StructLayout(LayoutKind.Sequential)]
    struct BITMAPINFO { public BITMAPINFOHEADER bmiHeader; public uint bmiColors; }

    [DllImport("user32.dll", SetLastError = true)]
    static extern bool UpdateLayeredWindow(IntPtr hwnd, IntPtr hdcDst, ref POINT pptDst, ref SIZE psize, IntPtr hdcSrc, ref POINT pptSrc, int crKey, ref BLENDFUNCTION pblend, int dwFlags);
    [DllImport("user32.dll")] static extern IntPtr GetDC(IntPtr hWnd);
    [DllImport("user32.dll")] static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);
    [DllImport("gdi32.dll")] static extern IntPtr CreateCompatibleDC(IntPtr hdc);
    [DllImport("gdi32.dll")] static extern bool DeleteDC(IntPtr hdc);
    [DllImport("gdi32.dll")] static extern IntPtr SelectObject(IntPtr hdc, IntPtr obj);
    [DllImport("gdi32.dll")] static extern bool DeleteObject(IntPtr obj);
    [DllImport("gdi32.dll", SetLastError = true)] static extern IntPtr CreateDIBSection(IntPtr hdc, ref BITMAPINFO pbmi, uint usage, out IntPtr bits, IntPtr hSection, uint offset);
    [DllImport("gdi32.dll")] static extern int GetDeviceCaps(IntPtr hdc, int index);
    [DllImport("kernel32.dll", EntryPoint = "RtlMoveMemory")] static extern void CopyMemory(IntPtr dest, IntPtr src, IntPtr count);

    readonly string title;
    readonly string body;
    readonly int timeoutMs;

    double scale = 1.0;
    int cardW, cardH, bitmapW, bitmapH, shadowPad;
    float radius, padX, padY, accentW, iconD, titlePx, bodyPx, gap, progressH;
    Color bg, accent, fg, sub, borderColor;
    double opacity, shadowStrength, shine;
    bool progressOn, iconOn, fadeOn;
    float titleLineH, bodyLineH;
    int titleH, bodyH;
    string cornerKey;

    // card layout (12-column grid)
    string layout = "bar", statusText = "", cardEyebrow = "", cardTitle = "";
    bool cardMode, statusOn;
    float gutter, iconBox, eyebrowPx, descPx, statusPx;
    float eyebrowH, titleH2, descLineH, titleLineH2, statusLineH2, descH;
    float cardTextX, cardTextW;
    float statusDotX, statusDotY, statusDotR;
    Color dotColor;

    // dsh layout (replica of the native DSH card)
    bool dshMode;
    float dshTile, dshTileX, dshTileTop, dshTextX, dshRightPad, dshTextW;
    float dshAppTop, dshTitleTop, dshBodyTop, dshBodyLineH, dshFooterTop, dshFooterH, dshBodyH;
    float dshAppPx, dshTitlePx, dshBodyPx, dshMetaPx, dshLinkPx, dshAppH, dshTitleH, dshMetaH;
    string dshAppText = "DeepSeek Harness", dshLinkText = "";
    string[] dshBodyLines = new string[0];
    Font dshAppFont, dshTitleFont, dshBodyFont, dshMetaFont, dshLinkFont;
    Color dshBorder, dshTileBg, dshIconColor, dshAppColor, dshBodyColor, dshMetaColor, dshLinkColor, dshCloseColor;
    RectangleF dshCloseRect;

    Font titleFont, bodyFont, eyebrowFont, cardTitleFont, descFont, statusFont;
    Bitmap staticBmp;
    Rectangle card;
    int contentLeft, contentWidth;

    Screen targetScreen;
    Point basePoint;
    bool soundOn, highContrast;
    public Action ShownCallback;
    public string CloseReason = "";
    public int CardHeight { get { return cardH; } }
    public int WindowHeight { get { return bitmapH; } }
    public bool StackUpward { get { return cornerKey == "br" || cornerKey == "bl"; } }

    System.Windows.Forms.Timer uiTimer, keepTimer;
    Stopwatch clock;
    long pausedAccum, pauseStarted;
    bool paused;
    double currentAlpha;
    int lastProgressStep = -1;

    static string Env(string name, string fallback)
    {
        var v = Environment.GetEnvironmentVariable(name);
        return String.IsNullOrEmpty(v) ? fallback : v;
    }

    static int EnvInt(string name, int fallback)
    {
        int v;
        return Int32.TryParse(Env(name, ""), out v) ? v : fallback;
    }

    static double EnvDouble(string name, double fallback)
    {
        double v;
        return Double.TryParse(Env(name, ""), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out v) ? v : fallback;
    }

    static Color EnvColor(string name, Color fallback)
    {
        try { return ColorTranslator.FromHtml(Env(name, "")); } catch { return fallback; }
    }

    static bool EnvFlag(string name, bool fallback)
    {
        var v = Env(name, "");
        if (v == "1" || v.Equals("true", StringComparison.OrdinalIgnoreCase)) return true;
        if (v == "0" || v.Equals("false", StringComparison.OrdinalIgnoreCase)) return false;
        return fallback;
    }

    static int Luminance(Color c) { return (c.R * 299 + c.G * 587 + c.B * 114) / 1000; }

    static Color Blend(Color a, Color b, double t)
    {
        t = Math.Max(0.0, Math.Min(1.0, t));
        return Color.FromArgb(
            (int)Math.Round(a.A + (b.A - a.A) * t),
            (int)Math.Round(a.R + (b.R - a.R) * t),
            (int)Math.Round(a.G + (b.G - a.G) * t),
            (int)Math.Round(a.B + (b.B - a.B) * t));
    }

    static Color Cool(Color c, int dr, int dg, int db)
    {
        return Color.FromArgb(
            c.A,
            Math.Max(0, Math.Min(255, c.R + dr)),
            Math.Max(0, Math.Min(255, c.G + dg)),
            Math.Max(0, Math.Min(255, c.B + db)));
    }

    static GraphicsPath Rounded(RectangleF r, float radius)
    {
        var path = new GraphicsPath();
        float m = Math.Min(radius, Math.Min(r.Width, r.Height) / 2f);
        if (m <= 0.25f) { path.AddRectangle(r); return path; }
        float d = m * 2f;
        path.AddArc(r.X, r.Y, d, d, 180, 90);
        path.AddArc(r.Right - d, r.Y, d, d, 270, 90);
        path.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90);
        path.AddArc(r.X, r.Bottom - d, d, d, 90, 90);
        path.CloseFigure();
        return path;
    }

    static string PickFamily(string wanted)
    {
        try
        {
            using (var col = new InstalledFontCollection())
            {
                foreach (var fam in col.Families)
                    if (String.Equals(fam.Name, wanted, StringComparison.OrdinalIgnoreCase)) return fam.Name;
            }
        }
        catch { }
        return "Segoe UI";
    }

    static float MeasureWidth(Graphics g, string text, Font font)
    {
        if (String.IsNullOrEmpty(text)) return 0f;
        using (var fmt = new StringFormat(StringFormat.GenericTypographic))
            return g.MeasureString(text, font, new PointF(0f, 0f), fmt).Width;
    }

    static string[] WrapLines(Graphics g, string text, Font font, float maxWidth, int maxLines)
    {
        var lines = new List<string>();
        if (String.IsNullOrEmpty(text)) return lines.ToArray();
        text = text.Replace("\r", "");
        foreach (string paragraph in text.Split('\n'))
        {
            if (lines.Count >= maxLines) break;
            string rest = paragraph.Trim();
            if (rest.Length == 0) { lines.Add(""); continue; }
            while (rest.Length > 0 && lines.Count < maxLines)
            {
                int fit = 0;
                int lo = 1, hi = rest.Length;
                while (lo <= hi)
                {
                    int mid = (lo + hi) / 2;
                    if (MeasureWidth(g, rest.Substring(0, mid), font) <= maxWidth) { fit = mid; lo = mid + 1; }
                    else hi = mid - 1;
                }
                if (fit >= rest.Length) { lines.Add(rest); rest = ""; break; }
                if (fit < 1) fit = 1;
                int brk = fit;
                int space = rest.LastIndexOf(' ', Math.Min(fit, rest.Length - 1));
                if (space > 0 && fit - space <= 10) brk = space + 1;
                lines.Add(rest.Substring(0, brk).TrimEnd());
                rest = rest.Substring(brk).TrimStart();
            }
            if (rest.Length > 0 && lines.Count >= maxLines)
            {
                lines[lines.Count - 1] = lines[lines.Count - 1] + "\u2026";
                break;
            }
        }
        return lines.ToArray();
    }

    static double ScreenScale()
    {
        try
        {
            IntPtr dc = GetDC(IntPtr.Zero);
            int dpi = GetDeviceCaps(dc, 88); // LOGPIXELSX
            ReleaseDC(IntPtr.Zero, dc);
            if (dpi >= 72 && dpi <= 480) return dpi / 96.0;
        }
        catch { }
        return 1.0;
    }

    public DshToast(string title, string body, int timeoutMs)
    {
        this.title = title ?? "";
        this.body = body ?? "";
        this.timeoutMs = Math.Max(3000, timeoutMs);

        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.Manual;
        ShowInTaskbar = false;
        TopMost = true;
        AutoScaleMode = AutoScaleMode.None;
        BackColor = Color.Black;
        Size = new Size(10, 10);

        ReadStyle();
        ComputeLayout();
        Location = ComputePosition();

        uiTimer = new System.Windows.Forms.Timer { Interval = 40 };
        uiTimer.Tick += OnTick;
        keepTimer = new System.Windows.Forms.Timer { Interval = 1000 };
        keepTimer.Tick += (s, e) => DshActions.KeepTop(Handle);

        clock = new Stopwatch();
        MouseEnter += (s, e) => { if (!paused) { paused = true; pauseStarted = clock.ElapsedMilliseconds; } };
        MouseLeave += (s, e) =>
        {
            if (paused) { paused = false; pausedAccum += clock.ElapsedMilliseconds - pauseStarted; }
        };
        EventHandler onClick = (s, e) =>
        {
            try
            {
                if (dshMode)
                {
                    Point hit = PointToClient(Cursor.Position);
                    if (dshCloseRect.Contains(hit)) { DshActions.Log("close-click"); CloseReason = "close"; Close(); return; }
                }
                DshActions.Log("click handler");
                CloseReason = "click";
                if (Env("DSH_NOTIFY_CLICK_ACTION", "focus") != "none") DshActions.FocusDsh(Handle);
            }
            catch (Exception ex) { DshActions.Log("click-error " + ex.Message); }
            try { Close(); } catch { }
        };
        Click += onClick;
        MouseUp += (s, e) =>
        {
            if (e.Button == MouseButtons.Right)
            {
                CloseReason = "dismiss";
                try { Close(); } catch { }
            }
        };
        DshActions.Log("layout card=" + cardW + "x" + cardH + " bitmap=" + bitmapW + "x" + bitmapH + " scale=" + scale + " bodyLines=" + (bodyLineH > 0 ? Math.Round(bodyH / bodyLineH, 2) : 0));
    }

    void ReadStyle()
    {
        double userScale = Math.Max(0.5, Math.Min(1.5, EnvDouble("DSH_NOTIFY_SCALE", 1.0)));
        string monitorKey = Env("DSH_NOTIFY_MONITOR", "cursor").Trim().ToLowerInvariant();
        targetScreen = monitorKey == "primary" ? Screen.PrimaryScreen : Screen.FromPoint(Cursor.Position);
        if (targetScreen == null) targetScreen = Screen.PrimaryScreen;
        scale = DshDpi.ScaleFor(targetScreen) * userScale;
        float s = (float)scale;

        int width = Math.Max(240, Math.Min(720, EnvInt("DSH_NOTIFY_WIDTH", 400)));
        bg = EnvColor("DSH_NOTIFY_BG", Color.FromArgb(32, 32, 32));
        accent = EnvColor("DSH_NOTIFY_ACCENT", Color.FromArgb(31, 111, 235));
        fg = EnvColor("DSH_NOTIFY_TEXT", Color.White);
        opacity = Math.Max(0.5, Math.Min(1.0, EnvDouble("DSH_NOTIFY_OPACITY", 0.97)));
        cornerKey = Env("DSH_NOTIFY_CORNER", "br");

        layout = Env("DSH_NOTIFY_LAYOUT", "bar").Trim().ToLowerInvariant();
        cardMode = layout == "card";
        dshMode = layout == "dsh";

        radius = (float)(Math.Max(0, Math.Min(28, EnvDouble("DSH_NOTIFY_RADIUS", 12))) * s);
        padX = (float)(Math.Max(12, Math.Min(40, EnvDouble("DSH_NOTIFY_PADX", 20))) * s);
        padY = (float)(Math.Max(10, Math.Min(32, EnvDouble("DSH_NOTIFY_PADY", 16))) * s);
        accentW = (float)(Math.Max(0, Math.Min(14, EnvDouble("DSH_NOTIFY_ACCENT_W", 4))) * s);
        progressH = (float)(Math.Max(0, Math.Min(6, EnvDouble("DSH_NOTIFY_PROGRESS_H", 2))) * s);
        shadowPad = (int)Math.Ceiling(Math.Max(0, Math.Min(24, EnvDouble("DSH_NOTIFY_SHADOW", 0.45))) * 22 * s);
        shadowStrength = Math.Max(0, Math.Min(1, EnvDouble("DSH_NOTIFY_SHADOW", 0.45)));
        if (dshMode)
        {
            shadowStrength = Math.Max(0, Math.Min(1, EnvDouble("DSH_NOTIFY_SHADOW", 0.15)));
            shadowPad = shadowStrength > 0.01 ? (int)Math.Ceiling(13 * s) : 0;
        }
        shine = Math.Max(0, Math.Min(0.30, EnvDouble("DSH_NOTIFY_SHINE", 0.05)));

        progressOn = EnvFlag("DSH_NOTIFY_PROGRESS", true) && progressH > 0.5f;
        iconOn = EnvFlag("DSH_NOTIFY_ICON", true);
        fadeOn = EnvFlag("DSH_NOTIFY_FADE", true);
        soundOn = EnvFlag("DSH_NOTIFY_SOUND", true);
        highContrast = EnvFlag("DSH_NOTIFY_HIGH_CONTRAST", false) || SystemInformation.HighContrast;
        if (EnvFlag("DSH_NOTIFY_REDUCE_MOTION", false)) fadeOn = false;

        titlePx = (float)(Math.Max(11, Math.Min(22, EnvDouble("DSH_NOTIFY_TITLE_SIZE", 15))) * s);
        bodyPx = (float)(Math.Max(10, Math.Min(20, EnvDouble("DSH_NOTIFY_BODY_SIZE", 13))) * s);
        gap = (float)(5.0 * s);
        iconD = (float)(7.0 * s);

        if (dshMode)
        {
            dshAppPx = Math.Max(12f * s, Math.Min(26f * s, titlePx * 1.15f));
            dshTitlePx = Math.Max(18f * s, Math.Min(40f * s, titlePx * 1.60f));
            dshBodyPx = Math.Max(11f * s, Math.Min(34f * s, bodyPx * 1.385f));
            dshMetaPx = Math.Max(10f * s, Math.Min(26f * s, bodyPx * 1.15f));
            dshLinkPx = Math.Max(10f * s, Math.Min(28f * s, bodyPx * 1.27f));
        }

        cardW = (int)Math.Round(width * s);
        sub = Env("DSH_NOTIFY_SUB", "") == "" ? Blend(fg, bg, Luminance(bg) > 140 ? 0.42 : 0.30) : EnvColor("DSH_NOTIFY_SUB", Blend(fg, bg, 0.30));
        borderColor = Luminance(bg) > 140 ? Blend(bg, Color.Black, 0.10) : Blend(bg, Color.White, 0.12);

        if (highContrast)
        {
            bg = SystemColors.Window;
            fg = SystemColors.WindowText;
            accent = SystemColors.Highlight;
            sub = SystemColors.WindowText;
            borderColor = SystemColors.WindowFrame;
            opacity = 1.0;
            shadowStrength = 0.0;
            shadowPad = 0;
            shine = 0.0;
            fadeOn = false;
            progressOn = false;
        }

        string family = PickFamily(Env("DSH_NOTIFY_FONT", "Microsoft YaHei UI"));
        titleFont = new Font(family, titlePx, FontStyle.Bold, GraphicsUnit.Pixel);
        bodyFont = new Font(family, bodyPx, FontStyle.Regular, GraphicsUnit.Pixel);

        statusText = Env("DSH_NOTIFY_STATUS", "").Replace("\r", " ").Replace("\n", " ");
        statusOn = statusText.Trim().Length > 0;
        if (cardMode) progressOn = false; // card layout keeps the body clean
        if (dshMode) { progressOn = false; accentW = 0f; } // dsh card has neither side bar nor progress

        gutter = 12f * s;
        iconBox = 56f * s;
        eyebrowPx = Math.Max(9f, Math.Min(18f, bodyPx * 0.92f));
        descPx = Math.Max(10f, Math.Min(26f, bodyPx * 1.15f));
        statusPx = Math.Max(10f, Math.Min(20f, bodyPx));
        dotColor = accent;

        string envEyebrow = Env("DSH_NOTIFY_EYEBROW", "").Trim();
        cardEyebrow = envEyebrow;
        cardTitle = title;
        int sep = title.IndexOf(" \u00b7 ", StringComparison.Ordinal);
        if (sep > 0)
        {
            if (cardEyebrow.Length == 0) cardEyebrow = title.Substring(0, sep).Trim();
            cardTitle = title.Substring(sep + 3).Trim();
        }
        else if (cardEyebrow.Length == 0)
        {
            cardEyebrow = "DSH";
        }

        eyebrowFont = new Font(family, eyebrowPx, FontStyle.Bold, GraphicsUnit.Pixel);
        cardTitleFont = new Font(family, titlePx * 1.85f, FontStyle.Bold, GraphicsUnit.Pixel);
        descFont = new Font(family, descPx, FontStyle.Regular, GraphicsUnit.Pixel);
        statusFont = new Font(family, statusPx, FontStyle.Regular, GraphicsUnit.Pixel);

        if (dshMode)
        {
            bool light = Luminance(bg) > 140;
            dshBorder = light ? Blend(bg, fg, 0.10) : Blend(bg, Color.White, 0.14);
            dshTileBg = light ? Blend(bg, fg, 0.055) : Blend(bg, Color.White, 0.09);
            dshIconColor = light ? Blend(fg, bg, 0.36) : Blend(fg, bg, 0.42);
            dshAppColor = light ? Blend(fg, bg, 0.30) : Blend(fg, bg, 0.34);
            dshBodyColor = light ? Blend(fg, bg, 0.33) : Blend(fg, bg, 0.38);
            dshMetaColor = light ? Blend(fg, bg, 0.38) : Blend(fg, bg, 0.42);
            dshLinkColor = light ? Blend(fg, bg, 0.22) : Blend(fg, bg, 0.30);
            dshCloseColor = light ? Blend(fg, bg, 0.55) : Blend(fg, bg, 0.45);
            if (light)
            {
                // The native card's grays lean blue; restore that cast after the fg/bg blend.
                dshTileBg = Cool(dshTileBg, 0, 2, 4);
                dshBorder = Cool(dshBorder, -2, 0, 2);
                dshAppColor = Cool(dshAppColor, 1, 7, 16);
                dshBodyColor = Cool(dshBodyColor, 0, 4, 9);
                dshMetaColor = Cool(dshMetaColor, 0, 2, 9);
                dshLinkColor = Cool(dshLinkColor, 0, 6, 18);
                dshCloseColor = Cool(dshCloseColor, 0, 4, 9);
            }
            dshAppFont = new Font(PickFamily("Segoe UI Semibold"), dshAppPx, FontStyle.Regular, GraphicsUnit.Pixel);
            dshTitleFont = new Font(family, dshTitlePx, FontStyle.Bold, GraphicsUnit.Pixel);
            dshBodyFont = new Font(family, dshBodyPx, FontStyle.Regular, GraphicsUnit.Pixel);
            dshMetaFont = new Font(family, dshMetaPx, FontStyle.Regular, GraphicsUnit.Pixel);
            dshLinkFont = new Font(family, dshLinkPx, FontStyle.Regular, GraphicsUnit.Pixel);
            dshAppText = envEyebrow.Length > 0 ? envEyebrow : "DeepSeek Harness";
            dshLinkText = "\u70b9\u51fb\u5207\u56de \u203a";
            dotColor = accent;

            if (highContrast)
            {
                dshBorder = SystemColors.WindowFrame;
                dshTileBg = SystemColors.Window;
                dshIconColor = SystemColors.WindowText;
                dshAppColor = SystemColors.WindowText;
                dshBodyColor = SystemColors.WindowText;
                dshMetaColor = SystemColors.WindowText;
                dshLinkColor = SystemColors.Highlight;
                dshCloseColor = SystemColors.WindowText;
            }
        }
    }

    void ComputeLayout()
    {
        float s = (float)scale;

        if (dshMode)
        {
            using (var probe = Graphics.FromImage(new Bitmap(1, 1)))
            {
                dshTile = 51f * s;
                dshTileX = 29f * s;
                dshTileTop = 32f * s;
                dshTextX = 101f * s;
                dshRightPad = 25f * s;
                dshTextW = Math.Max(40f, cardW - dshTextX - dshRightPad);

                dshAppH = (float)Math.Ceiling(dshAppFont.GetHeight(probe));
                dshTitleH = (float)Math.Ceiling(dshTitleFont.GetHeight(probe));
                dshBodyLineH = (float)Math.Round(dshBodyPx * 1.69f);
                dshMetaH = (float)Math.Ceiling(dshMetaFont.GetHeight(probe));

                dshBodyLines = WrapLines(probe, body, dshBodyFont, dshTextW, 3);
                dshBodyH = dshBodyLines.Length * dshBodyLineH;

                dshAppTop = 29f * s;
                dshTitleTop = dshAppTop + dshAppH + 5.5f * s;
                dshBodyTop = dshTitleTop + dshTitleH + 14f * s;
                dshFooterTop = dshBodyH > 0.5f
                    ? dshBodyTop + dshBodyH + 14.5f * s
                    : dshTitleTop + dshTitleH + 20f * s;
                dshFooterH = 32f * s;
                cardH = (int)Math.Round(dshFooterTop + dshFooterH + 14.5f * s);
                cardH = Math.Max((int)Math.Round(97 * s), cardH);
            }
        }
        else if (cardMode)
        {
            using (var probe = Graphics.FromImage(new Bitmap(1, 1)))
            {
                float colW = (cardW - padX * 2f - 11f * gutter) / 12f;
                cardTextX = padX + colW * 2f + gutter * 2f;
                cardTextW = cardW - padX - cardTextX;

                eyebrowH = (float)Math.Ceiling(eyebrowFont.GetHeight(probe));
                titleLineH2 = (float)Math.Ceiling(cardTitleFont.GetHeight(probe));
                descLineH = (float)Math.Ceiling(descFont.GetHeight(probe));
                statusLineH2 = (float)Math.Ceiling(statusFont.GetHeight(probe));

                var tfmt = new StringFormat { Trimming = StringTrimming.EllipsisCharacter, FormatFlags = StringFormatFlags.NoWrap };
                var tm = probe.MeasureString(cardTitle, cardTitleFont, new SizeF(Math.Max(40f, cardTextW), titleLineH2 * 2f), tfmt);
                titleH2 = (float)Math.Round(Math.Max(titleLineH2, tm.Height));

                float maxDesc = descLineH * 3f + 2f;
                var dfmt = new StringFormat { Trimming = StringTrimming.EllipsisCharacter };
                SizeF ds = String.IsNullOrEmpty(body)
                    ? new SizeF(0f, 0f)
                    : probe.MeasureString(body, descFont, new SizeF(Math.Max(40f, cardTextW), maxDesc), dfmt);
                descH = String.IsNullOrEmpty(body) ? 0f : (float)Math.Round(Math.Max(descLineH, Math.Min(ds.Height, maxDesc)));

                float gEyebrow = 3f * s, gDesc = 9f * s, gStatus = 17f * s;
                float total = padY + eyebrowH + gEyebrow + titleH2;
                if (descH > 0.5f) total += gDesc + descH;
                if (statusOn) total += gStatus + statusLineH2;
                total += padY + (progressOn ? progressH + 4f * s : 0f);
                total = Math.Max(total, padY * 2f + iconBox);

                cardH = (int)Math.Round(total);
                cardH = Math.Max((int)Math.Round(96 * scale), cardH);
            }
        }
        else
        {
            using (var probe = Graphics.FromImage(new Bitmap(1, 1)))
            {
                titleLineH = (float)Math.Ceiling(titleFont.GetHeight(probe));
                bodyLineH = (float)Math.Ceiling(bodyFont.GetHeight(probe));

                float iconSpace = iconOn ? iconD + 8f * s : 0f;
                contentLeft = (int)Math.Round(accentW + padX);
                contentWidth = (int)Math.Round(cardW - accentW - padX * 2f - iconSpace);

                int titleWidth = Math.Max(40, contentWidth);
                var fmt = new StringFormat { Trimming = StringTrimming.EllipsisCharacter, FormatFlags = StringFormatFlags.NoWrap };
                var measured = probe.MeasureString(title, titleFont, new SizeF(Math.Max(40f, titleWidth), titleLineH * 3f), fmt);
                titleH = (int)Math.Round(Math.Max(titleLineH, measured.Height));

                float maxBody = bodyLineH * 3f + 2f;
                SizeF bodySize = String.IsNullOrEmpty(body)
                    ? new SizeF(0f, 0f)
                    : probe.MeasureString(body, bodyFont, new SizeF(Math.Max(40f, contentWidth), maxBody), new StringFormat { Trimming = StringTrimming.EllipsisCharacter });
                bodyH = (int)Math.Round(Math.Max(bodyLineH, Math.Min(bodySize.Height, maxBody)));
            }

            float bodyTop = padY + titleH + gap;
            cardH = (int)Math.Round(bodyTop + bodyH + padY + (progressOn ? progressH + 4f * s : 0f));
            cardH = Math.Max((int)Math.Round(68 * scale), cardH);
        }

        bitmapW = cardW + shadowPad * 2;
        bitmapH = cardH + shadowPad * 2;
        card = new Rectangle(shadowPad, shadowPad, cardW, cardH);
        Size = new Size(bitmapW, bitmapH);
        if (dshMode) dshCloseRect = new RectangleF(card.X + cardW - 54f * s, card.Y + 26f * s, 30f * s, 30f * s);
    }

    Point ComputePosition()
    {
        var screen = targetScreen ?? Screen.PrimaryScreen;
        var wa = screen.WorkingArea;
        int mx = (int)Math.Round(Math.Max(0, EnvInt("DSH_NOTIFY_MX", 16)) * scale);
        int my = (int)Math.Round(Math.Max(0, EnvInt("DSH_NOTIFY_MY", 16)) * scale);
        int x, y;
        switch (cornerKey)
        {
            case "bl": x = wa.Left + mx; y = wa.Bottom - cardH - my; break;
            case "tr": x = wa.Right - cardW - mx; y = wa.Top + my; break;
            case "tl": x = wa.Left + mx; y = wa.Top + my; break;
            default: x = wa.Right - cardW - mx; y = wa.Bottom - cardH - my; break;
        }
        DshActions.Log("popup screen=" + screen.DeviceName + " work=" + wa + " cursor=" + Cursor.Position + " corner=" + cornerKey + " card=" + new Point(x, y) + " size=" + new Size(cardW, cardH));
        basePoint = new Point(x - shadowPad, y - shadowPad);
        return basePoint;
    }

    public void ApplyStackOffset(int offset)
    {
        if (basePoint.IsEmpty) return;
        int y = basePoint.Y + (StackUpward ? -offset : offset);
        Location = new Point(basePoint.X, y);
    }

    public void CloseWith(string reason)
    {
        CloseReason = reason;
        try { Close(); } catch { }
    }

    void BuildStatic()
    {
        if (staticBmp != null) staticBmp.Dispose();
        staticBmp = new Bitmap(bitmapW, bitmapH, PixelFormat.Format32bppPArgb);
        using (var g = Graphics.FromImage(staticBmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.TextRenderingHint = TextRenderingHint.AntiAlias;

            RectangleF rect = new RectangleF(card.X, card.Y, card.Width, card.Height);

            if (shadowStrength > 0.02 && shadowPad > 0)
            {
                int layers = dshMode ? 7 : 10;
                float spread = shadowPad * (dshMode ? 0.8f : 0.9f);
                for (int i = layers; i >= 1; i--)
                {
                    float grow = spread * i / layers;
                    double t = (double)i / layers;
                    int alpha = dshMode
                        ? (int)Math.Round(1.0 + 4.0 * shadowStrength * (1.0 - t))
                        : (int)Math.Round(4 + 62 * shadowStrength * Math.Pow(1.0 - t, 1.6));
                    var r = RectangleF.Inflate(rect, grow, grow * 0.8f);
                    r.Offset(0, (dshMode ? 3.2f : 4f) * (float)scale * (float)t);
                    using (var p = Rounded(r, radius + grow))
                    using (var br = new SolidBrush(Color.FromArgb(Math.Min(255, Math.Max(1, alpha)), 0, 0, 0)))
                        g.FillPath(br, p);
                }
            }

            using (var cardPath = Rounded(rect, radius))
            {
                if (shine > 0.001)
                {
                    Color top = Blend(bg, Color.White, shine);
                    using (var br = new LinearGradientBrush(rect, top, bg, LinearGradientMode.Vertical))
                        g.FillPath(br, cardPath);
                }
                else
                {
                    using (var br = new SolidBrush(bg)) g.FillPath(br, cardPath);
                }

                var saved = g.Save();
                g.SetClip(cardPath, CombineMode.Replace);
                if (accentW > 0.5f && !cardMode)
                {
                    var bar = new RectangleF(rect.X, rect.Y, accentW, rect.Height);
                    using (var br = new LinearGradientBrush(bar, accent, Blend(accent, bg, 0.28), LinearGradientMode.Vertical))
                        g.FillRectangle(br, bar);
                }
                g.Restore(saved);

                if (dshMode)
                {
                    // Native card reads 2px on top/left, 1px on bottom/right.
                    float bw = (float)scale;
                    var inset = new RectangleF(rect.X + bw, rect.Y + bw, rect.Width - 2f * bw, rect.Height - 2f * bw);
                    var shift = new RectangleF(rect.X + 2f * bw, rect.Y + 2f * bw, rect.Width - 2f * bw, rect.Height - 2f * bw);
                    using (var inner = Rounded(inset, Math.Max(0f, radius - bw)))
                    using (var shifted = Rounded(shift, Math.Max(0f, radius - bw)))
                    using (var ring1 = new GraphicsPath(FillMode.Alternate))
                    using (var ring2 = new GraphicsPath(FillMode.Alternate))
                    using (var br = new SolidBrush(dshBorder))
                    {
                        ring1.AddPath(cardPath, false);
                        ring1.AddPath(inner, false);
                        ring2.AddPath(inner, false);
                        ring2.AddPath(shifted, false);
                        g.FillPath(br, ring1);
                        g.FillPath(br, ring2);
                    }
                }
                else
                {
                    using (var pen = new Pen(borderColor, 1f)) g.DrawPath(pen, cardPath);
                }

                if (!dshMode)
                {
                    var glaze = g.Save();
                    g.SetClip(cardPath, CombineMode.Replace);
                    var glazeRect = new RectangleF(rect.X, rect.Y, rect.Width, Math.Max(2f, rect.Height * 0.42f));
                    using (var br = new LinearGradientBrush(glazeRect, Color.FromArgb(26, 255, 255, 255), Color.FromArgb(0, 255, 255, 255), LinearGradientMode.Vertical))
                        g.FillRectangle(br, glazeRect);
                    g.Restore(glaze);
                }
            }

            if (dshMode) { DrawDshContent(g); return; }
            if (cardMode) { DrawCardContent(g); return; }

            float iconSpace = iconOn ? iconD + 9f * (float)scale : 0f;
            float textX = card.X + contentLeft + iconSpace;
            float titleY = card.Y + padY;

            if (iconOn)
            {
                var dot = new RectangleF(card.X + contentLeft, titleY + (titleLineH - iconD) / 2f, iconD, iconD);
                using (var br = new SolidBrush(accent)) g.FillEllipse(br, dot);
            }

            float titleWidth = card.Right - padX - textX;
            var titleFmt = new StringFormat { Trimming = StringTrimming.EllipsisCharacter, FormatFlags = StringFormatFlags.NoWrap, LineAlignment = StringAlignment.Center };
            using (var br = new SolidBrush(fg))
                g.DrawString(title, titleFont, br, new RectangleF(textX, titleY, titleWidth, titleLineH), titleFmt);

            if (!String.IsNullOrEmpty(body))
            {
                var bodyFmt = new StringFormat { Trimming = StringTrimming.EllipsisCharacter };
                using (var br = new SolidBrush(sub))
                    g.DrawString(body, bodyFont, br, new RectangleF(textX, titleY + titleH + gap, contentWidth, bodyH + 2f), bodyFmt);
            }
        }
    }

    static void DrawWeave(Graphics g, PointF c, float r, Color color, float w)
    {
        var pts = new PointF[] { new PointF(c.X, c.Y - r), new PointF(c.X + r, c.Y), new PointF(c.X, c.Y + r), new PointF(c.X - r, c.Y) };
        using (var path = new GraphicsPath())
        {
            path.AddPolygon(pts);
            using (var pen = new Pen(color, w)) { pen.LineJoin = LineJoin.Round; g.DrawPath(pen, path); }
        }
    }

    static void DrawTracked(Graphics g, string text, Font font, Brush brush, float x, float y, float tracking)
    {
        float cx = x;
        foreach (char ch in text)
        {
            string piece = ch.ToString();
            g.DrawString(piece, font, brush, cx, y);
            cx += g.MeasureString(piece, font).Width + tracking;
        }
    }

    void DrawCardContent(Graphics g)
    {
        float s = (float)scale;
        float x0 = card.X + padX;
        float y0 = card.Y + padY;

        if (iconBox > 0.5f)
        {
            var boxRect = new RectangleF(x0, y0, iconBox, iconBox);
            float boxR = iconBox * 0.23f;
            using (var p = Rounded(boxRect, boxR))
            using (var br = new SolidBrush(Blend(bg, accent, 0.10)))
                g.FillPath(br, p);
            using (var p = Rounded(boxRect, boxR))
            using (var pen = new Pen(Color.FromArgb(Luminance(bg) > 140 ? 30 : 44, accent), 1f))
                g.DrawPath(pen, p);

            var c = new PointF(boxRect.X + iconBox / 2f, boxRect.Y + iconBox / 2f);
            float u = iconBox;
            DrawWeave(g, c, u * 0.335f, accent, u * 0.052f);
            DrawWeave(g, c, u * 0.238f, Blend(accent, Color.White, 0.32), u * 0.046f);
            DrawWeave(g, c, u * 0.142f, accent, u * 0.037f);

            float d = u * 0.238f;
            using (var pen = new Pen(Color.FromArgb(205, accent), u * 0.026f))
            {
                g.DrawLine(pen, c.X - d, c.Y - d, c.X + d, c.Y + d);
                g.DrawLine(pen, c.X + d, c.Y - d, c.X - d, c.Y + d);
            }
            using (var br = new SolidBrush(Blend(accent, Color.White, 0.32)))
                g.FillEllipse(br, c.X - u * 0.043f, c.Y - u * 0.043f, u * 0.086f, u * 0.086f);
        }

        float tx = card.X + cardTextX;
        float tw = cardTextW;
        float y = card.Y + padY;

        if (cardEyebrow.Length > 0)
        {
            using (var br = new SolidBrush(Blend(fg, bg, Luminance(bg) > 140 ? 0.50 : 0.55)))
                DrawTracked(g, cardEyebrow, eyebrowFont, br, tx, y + (eyebrowH - eyebrowFont.GetHeight(g)) / 2f, eyebrowPx * 0.15f);
        }
        y += eyebrowH + 3f * s;

        var tfmt = new StringFormat { Trimming = StringTrimming.EllipsisCharacter, FormatFlags = StringFormatFlags.NoWrap };
        using (var br = new SolidBrush(fg))
            g.DrawString(cardTitle, cardTitleFont, br, new RectangleF(tx, y, tw, titleH2), tfmt);
        y += titleH2;

        if (descH > 0.5f)
        {
            y += 9f * s;
            var dfmt = new StringFormat { Trimming = StringTrimming.EllipsisCharacter };
            using (var br = new SolidBrush(sub))
                g.DrawString(body, descFont, br, new RectangleF(tx, y, tw, descH + 2f), dfmt);
            y += descH;
        }

        statusDotR = 0f;
        if (statusOn)
        {
            y += 17f * s;
            float dotD = statusLineH2 * 0.44f;
            float dcx = tx + dotD / 2f;
            float dcy = y + statusLineH2 / 2f - 1f;
            statusDotX = dcx;
            statusDotY = dcy;
            statusDotR = dotD / 2f;

            using (var br = new SolidBrush(dotColor))
                g.FillEllipse(br, dcx - dotD / 2f, dcy - dotD / 2f, dotD, dotD);

            var sfmt = new StringFormat { Trimming = StringTrimming.EllipsisCharacter, FormatFlags = StringFormatFlags.NoWrap, LineAlignment = StringAlignment.Center };
            using (var br = new SolidBrush(Blend(fg, bg, Luminance(bg) > 140 ? 0.52 : 0.58)))
                g.DrawString(statusText, statusFont, br, new RectangleF(tx + dotD + 8f * s, y, tw - dotD - 8f * s, statusLineH2), sfmt);
        }
    }

    void DrawDshContent(Graphics g)
    {
        float s = (float)scale;
        float tx = card.X + dshTextX;

        var tile = new RectangleF(card.X + dshTileX, card.Y + dshTileTop, dshTile, dshTile);
        using (var p = Rounded(tile, dshTile * 0.196f))
        using (var br = new SolidBrush(dshTileBg))
            g.FillPath(br, p);
        DrawWhale(g, new RectangleF(tile.X + dshTile * 0.1176f, tile.Y + dshTile * 0.1176f, dshTile * 0.7647f, dshTile * 0.7647f), dshIconColor);

        var noWrap = new StringFormat(StringFormat.GenericTypographic);
        noWrap.FormatFlags |= StringFormatFlags.NoWrap;
        using (var br = new SolidBrush(dshAppColor))
            g.DrawString(dshAppText, dshAppFont, br, new RectangleF(tx, card.Y + dshAppTop, dshTextW, dshAppH), noWrap);
        noWrap.Dispose();

        var tf = new StringFormat(StringFormat.GenericTypographic);
        tf.Trimming = StringTrimming.EllipsisCharacter;
        tf.FormatFlags |= StringFormatFlags.NoWrap;
        using (var br = new SolidBrush(fg))
            g.DrawString(cardTitle, dshTitleFont, br, new RectangleF(tx, card.Y + dshTitleTop, dshTextW, dshTitleH), tf);
        tf.Dispose();

        var bf = new StringFormat(StringFormat.GenericTypographic);
        bf.FormatFlags |= StringFormatFlags.NoWrap;
        using (var br = new SolidBrush(dshBodyColor))
        {
            for (int i = 0; i < dshBodyLines.Length; i++)
            {
                if (dshBodyLines[i].Length == 0) continue;
                g.DrawString(dshBodyLines[i], dshBodyFont, br, new PointF(tx, card.Y + dshBodyTop + i * dshBodyLineH), bf);
            }
        }
        bf.Dispose();

        float fy = card.Y + dshFooterTop;
        float dotW = 7f * s, dotH = 7.6f * s;
        using (var br = new SolidBrush(dotColor))
            g.FillEllipse(br, tx, fy + 15.5f * s - dotH / 2f, dotW, dotH);

        var lf = new StringFormat(StringFormat.GenericTypographic);
        lf.Alignment = StringAlignment.Far;
        lf.LineAlignment = StringAlignment.Center;
        lf.FormatFlags |= StringFormatFlags.NoWrap;
        using (var br = new SolidBrush(dshLinkColor))
            g.DrawString(dshLinkText, dshLinkFont, br, new RectangleF(card.Right - dshRightPad - 300f * s, fy, 300f * s, dshFooterH), lf);
        lf.Dispose();

        float cx = card.Right - 39f * s;
        float cy = card.Y + 41f * s;
        float d = 5f * s;
        using (var pen = new Pen(dshCloseColor, 2f * s))
        {
            pen.StartCap = LineCap.Round;
            pen.EndCap = LineCap.Round;
            g.DrawLine(pen, cx - d, cy - d, cx + d, cy + d);
            g.DrawLine(pen, cx + d, cy - d, cx - d, cy + d);
        }
    }

    void DrawDshFooterLabel(Graphics g, double alpha)
    {
        float s = (float)scale;
        string text;
        if (statusOn) text = statusText;
        else if (paused) text = "\u5df2\u6682\u505c \u00b7 \u79fb\u5f00\u7ee7\u7eed";
        else
        {
            long remaining = Math.Max(0L, (long)timeoutMs - ElapsedMs());
            int sec = (int)Math.Ceiling(remaining / 1000.0);
            text = sec + " \u79d2\u540e\u6536\u8d77 \u00b7 \u60ac\u505c\u53ef\u4fdd\u7559";
        }
        int a = (int)Math.Round(255 * alpha);
        if (a <= 0) return;
        var fmt = new StringFormat(StringFormat.GenericTypographic);
        fmt.LineAlignment = StringAlignment.Center;
        fmt.FormatFlags |= StringFormatFlags.NoWrap;
        using (var br = new SolidBrush(Color.FromArgb(a, dshMetaColor)))
            g.DrawString(text, dshMetaFont, br, new RectangleF(card.X + dshTextX + 15f * s, card.Y + dshFooterTop, dshTextW - 15f * s, dshFooterH), fmt);
        fmt.Dispose();
    }

    static void DrawWhale(Graphics g, RectangleF box, Color color)
    {
        float sc = box.Width / 50f;
        using (var path = new GraphicsPath(FillMode.Winding))
        {
            int index = 0;
            for (int sub = 0; sub < WhaleCounts.Length; sub++)
            {
                int count = WhaleCounts[sub];
                var pts = new PointF[count];
                for (int i = 0; i < count; i++)
                {
                    pts[i] = new PointF(box.X + WhalePts[(index + i) * 2] * sc, box.Y + WhalePts[(index + i) * 2 + 1] * sc);
                }
                index += count;
                path.AddPolygon(pts);
            }
            using (var br = new SolidBrush(color))
                g.FillPath(br, path);
        }
    }

    static readonly float[] WhalePts = new float[] {
        48.84f,10.05f,48.6f,9.98f,48.41f,10f,48.24f,10.1f,48.09f,10.24f,
        47.95f,10.39f,47.8f,10.53f,47.75f,10.57f,47.71f,10.61f,47.66f,10.66f,
        47.61f,10.71f,47.57f,10.76f,47.53f,10.81f,47.14f,11.19f,46.73f,11.52f,
        46.29f,11.78f,45.82f,11.97f,45.31f,12.08f,44.76f,12.1f,43.95f,12.1f,
        43.17f,12.22f,42.43f,12.44f,41.72f,12.79f,41.05f,13.25f,40.41f,13.84f,
        40.22f,13.09f,39.94f,12.44f,39.56f,11.88f,39.09f,11.4f,38.53f,10.99f,
        37.89f,10.66f,37.54f,10.49f,37.19f,10.32f,36.85f,10.13f,36.53f,9.9f,
        36.24f,9.64f,35.97f,9.32f,35.82f,9.07f,35.7f,8.81f,35.6f,8.54f,
        35.52f,8.27f,35.44f,8f,35.36f,7.73f,35.3f,7.56f,35.24f,7.41f,
        35.16f,7.27f,35.06f,7.15f,34.93f,7.06f,34.77f,7.01f,34.58f,7.01f,
        34.44f,7.06f,34.31f,7.16f,34.21f,7.29f,34.13f,7.43f,34.05f,7.58f,
        33.76f,8.17f,33.54f,8.79f,33.38f,9.42f,33.27f,10.06f,33.21f,10.71f,
        33.2f,11.36f,33.32f,12.79f,33.64f,14.11f,34.16f,15.33f,34.87f,16.44f,
        35.79f,17.44f,36.9f,18.34f,37.02f,18.43f,37.11f,18.53f,37.17f,18.63f,
        37.19f,18.75f,37.19f,18.87f,37.16f,19f,37.07f,19.29f,36.99f,19.57f,
        36.89f,19.86f,36.8f,20.14f,36.71f,20.43f,36.62f,20.71f,36.56f,20.87f,
        36.49f,20.99f,36.4f,21.05f,36.28f,21.08f,36.14f,21.06f,35.96f,21f,
        35.31f,20.69f,34.69f,20.34f,34.1f,19.96f,33.53f,19.53f,32.98f,19.07f,
        32.46f,18.58f,31.61f,17.71f,30.77f,16.83f,29.93f,15.96f,29.07f,15.11f,
        28.18f,14.29f,27.23f,13.52f,27f,13.35f,26.78f,13.18f,26.55f,13.02f,
        26.31f,12.86f,26.08f,12.71f,25.85f,12.55f,25.18f,11.6f,25.05f,10.74f,
        25.3f,10f,25.75f,9.4f,26.25f,8.99f,26.63f,8.78f,26.82f,8.64f,
        26.85f,8.46f,26.71f,8.26f,26.37f,8.08f,25.82f,7.94f,25.06f,7.9f,
        24.19f,7.95f,23.33f,8.09f,22.46f,8.3f,21.57f,8.59f,20.64f,8.92f,
        19.65f,9.3f,19.5f,9.36f,19.34f,9.41f,19.19f,9.46f,19.03f,9.51f,
        18.87f,9.55f,18.71f,9.58f,17.77f,9.43f,16.83f,9.32f,15.87f,9.26f,
        14.89f,9.25f,13.9f,9.29f,12.9f,9.38f,11.07f,9.71f,9.36f,10.27f,
        7.79f,11.06f,6.34f,12.08f,5.02f,13.31f,3.84f,14.77f,2.67f,16.69f,
        1.82f,18.69f,1.28f,20.75f,1.03f,22.87f,1.04f,25.04f,1.31f,27.26f,
        1.84f,29.54f,2.62f,31.68f,3.64f,33.69f,4.9f,35.56f,6.38f,37.29f,
        8.07f,38.88f,9.99f,40.32f,12.01f,41.49f,14.12f,42.37f,16.33f,42.97f,
        18.63f,43.28f,21.04f,43.28f,22.56f,43.16f,24.14f,42.93f,25.78f,42.52f,
        27.49f,41.85f,29.26f,40.85f,31.1f,39.46f,31.58f,39.67f,32.09f,39.85f,
        32.63f,39.99f,33.24f,40.1f,33.91f,40.19f,34.69f,40.27f,35.32f,40.31f,
        35.93f,40.3f,36.52f,40.26f,37.09f,40.19f,37.63f,40.11f,38.12f,40.01f,
        38.73f,39.77f,39.12f,39.41f,39.3f,39f,39.31f,38.59f,39.19f,38.25f,
        38.96f,38.03f,37.2f,37.22f,36.12f,36.77f,35.53f,36.56f,35.23f,36.47f,
        35.02f,36.36f,34.71f,36.13f,35.89f,34.76f,37.17f,33.2f,38.46f,31.29f,
        39.68f,28.85f,40.74f,25.72f,41.54f,21.73f,41.58f,21.39f,41.59f,21.09f,
        41.58f,20.81f,41.57f,20.54f,41.55f,20.27f,41.54f,19.99f,41.54f,19.83f,
        41.57f,19.71f,41.62f,19.61f,41.71f,19.54f,41.83f,19.49f,42f,19.46f,
        42.55f,19.38f,43.08f,19.27f,43.61f,19.13f,44.12f,18.95f,44.63f,18.74f,
        45.12f,18.49f,46.39f,17.62f,47.4f,16.6f,48.18f,15.44f,48.74f,14.15f,
        49.12f,12.75f,49.33f,11.26f,49.34f,11.02f,49.33f,10.79f,49.28f,10.57f,
        49.19f,10.37f,49.04f,10.19f,48.84f,10.05f,24.33f,37.84f,22.4f,36.34f,
        20.81f,35.18f,19.52f,34.34f,18.51f,33.78f,17.76f,33.48f,17.24f,33.4f,
        16.92f,33.49f,16.72f,33.69f,16.64f,33.98f,16.63f,34.31f,16.68f,34.65f,
        16.76f,34.97f,16.86f,35.25f,16.96f,35.51f,17.08f,35.76f,17.21f,35.99f,
        17.35f,36.24f,17.51f,36.49f,17.62f,36.67f,17.69f,36.88f,17.71f,37.09f,
        17.67f,37.31f,17.53f,37.53f,17.28f,37.73f,16.54f,38f,15.71f,38.03f,
        14.91f,37.9f,14.2f,37.69f,13.69f,37.49f,13.46f,37.38f,12.13f,36.51f,
        10.88f,35.55f,9.72f,34.48f,8.65f,33.3f,7.68f,32.01f,6.81f,30.58f,
        6.09f,29.13f,5.48f,27.65f,4.98f,26.13f,4.6f,24.58f,4.34f,22.99f,
        4.2f,21.37f,4.2f,21.01f,4.26f,20.73f,4.37f,20.52f,4.56f,20.36f,
        4.82f,20.24f,5.16f,20.15f,5.67f,20.07f,6.18f,20.01f,6.7f,19.98f,
        7.21f,19.98f,7.73f,20.01f,8.24f,20.07f,10.33f,20.5f,12.32f,21.15f,
        14.21f,22f,15.99f,23.06f,17.67f,24.32f,19.25f,25.78f,20.09f,26.69f,
        20.88f,27.64f,21.62f,28.64f,22.32f,29.65f,23.01f,30.69f,23.69f,31.72f,
        24.42f,32.81f,25.19f,33.87f,25.98f,34.9f,26.83f,35.88f,27.72f,36.83f,
        28.68f,37.71f,29.02f,38f,29.34f,38.26f,29.64f,38.51f,29.93f,38.73f,
        30.21f,38.93f,30.48f,39.1f,29.59f,39.18f,28.58f,39.19f,27.49f,39.1f,
        26.38f,38.87f,25.31f,38.46f,24.33f,37.84f,26.34f,24.6f,26.37f,24.43f,
        26.43f,24.28f,26.52f,24.15f,26.65f,24.05f,26.8f,23.99f,26.97f,23.97f,
        27f,23.97f,27.04f,23.97f,27.08f,23.98f,27.11f,23.99f,27.15f,24f,
        27.18f,24.01f,27.22f,24.03f,27.26f,24.05f,27.3f,24.07f,27.34f,24.1f,
        27.37f,24.13f,27.41f,24.16f,27.46f,24.22f,27.5f,24.29f,27.53f,24.36f,
        27.56f,24.44f,27.57f,24.52f,27.58f,24.6f,27.56f,24.77f,27.5f,24.92f,
        27.4f,25.05f,27.27f,25.15f,27.12f,25.21f,26.96f,25.23f,26.79f,25.21f,
        26.64f,25.15f,26.52f,25.05f,26.43f,24.92f,26.36f,24.77f,26.34f,24.6f,
        32.61f,27.88f,32.41f,27.96f,32.21f,28.04f,32.01f,28.1f,31.81f,28.15f,
        31.61f,28.19f,31.42f,28.21f,31.11f,28.2f,30.81f,28.15f,30.52f,28.07f,
        30.25f,27.97f,30.01f,27.83f,29.81f,27.69f,29.55f,27.47f,29.31f,27.26f,
        29.11f,27.04f,28.94f,26.79f,28.8f,26.5f,28.7f,26.13f,28.67f,25.94f,
        28.66f,25.73f,28.66f,25.51f,28.68f,25.29f,28.7f,25.09f,28.73f,24.92f,
        28.78f,24.6f,28.77f,24.32f,28.72f,24.07f,28.61f,23.84f,28.46f,23.62f,
        28.25f,23.42f,28.05f,23.28f,27.84f,23.18f,27.61f,23.1f,27.37f,23.05f,
        27.12f,23.02f,26.86f,23.02f,26.77f,23.01f,26.67f,22.99f,26.58f,22.96f,
        26.5f,22.93f,26.42f,22.89f,26.35f,22.86f,26.25f,22.79f,26.16f,22.69f,
        26.09f,22.58f,26.06f,22.44f,26.06f,22.29f,26.12f,22.12f,26.17f,22.05f,
        26.23f,21.97f,26.31f,21.88f,26.39f,21.8f,26.46f,21.73f,26.51f,21.69f,
        26.88f,21.52f,27.26f,21.44f,27.65f,21.43f,28.04f,21.48f,28.43f,21.58f,
        28.82f,21.72f,29.16f,21.89f,29.48f,22.1f,29.8f,22.35f,30.13f,22.64f,
        30.47f,22.96f,30.83f,23.33f,31.18f,23.74f,31.44f,24.07f,31.65f,24.35f,
        31.83f,24.62f,32.01f,24.89f,32.21f,25.21f,32.39f,25.48f,32.55f,25.76f,
        32.71f,26.04f,32.86f,26.34f,32.99f,26.64f,33.11f,26.95f,33.15f,27.15f,
        33.14f,27.33f,33.08f,27.49f,32.97f,27.64f,32.81f,27.77f,32.61f,27.88f
    };
    static readonly int[] WhaleCounts = new int[] { 223, 85, 37, 85 };

    RectangleF ProgressRect(double fraction)
    {
        float left = card.X + (accentW > 0.5f ? accentW : 0f);
        float maxW = card.Right - left;
        float w = (float)Math.Max(progressH, maxW * Math.Max(0.0, Math.Min(1.0, fraction)));
        float y = card.Bottom - progressH;
        return new RectangleF(left, y, w, progressH);
    }

    void Render(double alpha)
    {
        if (staticBmp == null) BuildStatic();
        using (var frame = new Bitmap(bitmapW, bitmapH, PixelFormat.Format32bppPArgb))
        {
            using (var g = Graphics.FromImage(frame))
            {
                g.SmoothingMode = SmoothingMode.AntiAlias;
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                var matrix = new ColorMatrix { Matrix33 = (float)Math.Max(0.0, Math.Min(1.0, alpha)) };
                using (var attrs = new ImageAttributes())
                {
                    attrs.SetColorMatrix(matrix, ColorMatrixFlag.Default, ColorAdjustType.Bitmap);
                    g.DrawImage(staticBmp, new Rectangle(0, 0, bitmapW, bitmapH), 0, 0, bitmapW, bitmapH, GraphicsUnit.Pixel, attrs);
                }
                if (progressOn)
                {
                    double fraction = 1.0 - Math.Min(1.0, Math.Max(0.0, (double)ElapsedMs() / timeoutMs));
                    var saved = g.Save();
                    using (var clip = Rounded(card, radius)) g.SetClip(clip, CombineMode.Intersect);
                    using (var p = Rounded(ProgressRect(fraction), progressH / 2f))
                    using (var br = new SolidBrush(Color.FromArgb((int)Math.Round(165 * Math.Min(1.0, alpha)), Blend(accent, bg, 0.32))))
                        g.FillPath(br, p);
                    g.Restore(saved);
                }
                if (cardMode && statusOn && statusDotR > 0.5f)
                {
                    double phase = (ElapsedMs() % 2000) / 2000.0;
                    float rr = statusDotR * (1f + (float)phase * 2.4f);
                    int aa = (int)Math.Round(70 * (1.0 - phase) * Math.Min(1.0, alpha));
                    if (aa > 0)
                    {
                        using (var br = new SolidBrush(Color.FromArgb(aa, dotColor)))
                            g.FillEllipse(br, statusDotX - rr, statusDotY - rr, rr * 2f, rr * 2f);
                    }
                }
                if (dshMode) DrawDshFooterLabel(g, Math.Min(1.0, alpha));
            }
            PushLayered(frame);
        }
    }

    void PushLayered(Bitmap bmp)
    {
        IntPtr screenDc = GetDC(IntPtr.Zero);
        IntPtr memDc = CreateCompatibleDC(screenDc);
        IntPtr dib = IntPtr.Zero;
        BitmapData data = null;
        try
        {
            var bi = new BITMAPINFO();
            bi.bmiHeader.biSize = (uint)Marshal.SizeOf(typeof(BITMAPINFOHEADER));
            bi.bmiHeader.biWidth = bmp.Width;
            bi.bmiHeader.biHeight = -bmp.Height;
            bi.bmiHeader.biPlanes = 1;
            bi.bmiHeader.biBitCount = 32;
            bi.bmiHeader.biCompression = 0;
            IntPtr bits;
            dib = CreateDIBSection(memDc, ref bi, 0, out bits, IntPtr.Zero, 0);
            if (dib == IntPtr.Zero) throw new Exception("CreateDIBSection failed " + Marshal.GetLastWin32Error());

            data = bmp.LockBits(new Rectangle(0, 0, bmp.Width, bmp.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppPArgb);
            for (int row = 0; row < bmp.Height; row++)
            {
                IntPtr src = new IntPtr(data.Scan0.ToInt64() + (long)row * data.Stride);
                IntPtr dst = new IntPtr(bits.ToInt64() + (long)row * bmp.Width * 4);
                CopyMemory(dst, src, new IntPtr(bmp.Width * 4));
            }
            bmp.UnlockBits(data);
            data = null;

            IntPtr previous = SelectObject(memDc, dib);
            var blend = new BLENDFUNCTION();
            blend.BlendOp = 0;
            blend.BlendFlags = 0;
            blend.SourceConstantAlpha = 255;
            blend.AlphaFormat = 1;
            var dstPt = new POINT { X = Location.X, Y = Location.Y };
            var srcPt = new POINT();
            var size = new SIZE { cx = bmp.Width, cy = bmp.Height };
            bool ok = UpdateLayeredWindow(Handle, screenDc, ref dstPt, ref size, memDc, ref srcPt, 0, ref blend, ULW_ALPHA);
            SelectObject(memDc, previous);
            if (!ok) throw new Exception("UpdateLayeredWindow failed " + Marshal.GetLastWin32Error());
        }
        finally
        {
            if (data != null) { try { bmp.UnlockBits(data); } catch { } }
            if (dib != IntPtr.Zero) DeleteObject(dib);
            DeleteDC(memDc);
            ReleaseDC(IntPtr.Zero, screenDc);
        }
    }

    long ElapsedMs()
    {
        long now = clock.ElapsedMilliseconds;
        long extra = paused ? now - pauseStarted : 0;
        return now - pausedAccum - extra;
    }

    void OnTick(object sender, EventArgs e)
    {
        long elapsed = ElapsedMs();
        if (elapsed >= timeoutMs) { uiTimer.Stop(); CloseReason = "timeout"; Close(); return; }

        double target;
        if (!fadeOn) target = 1.0;
        else
        {
            const double fadeIn = 170.0, fadeOut = 240.0;
            double remaining = timeoutMs - elapsed;
            if (elapsed < fadeIn) { double t = elapsed / fadeIn; target = 1.0 - Math.Pow(1.0 - t, 3.0); }
            else if (remaining < fadeOut) { target = Math.Max(0.0, remaining / fadeOut); }
            else target = 1.0;
        }

        int step = (int)(elapsed / 250);
        bool animationFrame = Math.Abs(target - currentAlpha) > 0.001 || step != lastProgressStep;
        if (animationFrame)
        {
            currentAlpha = target;
            lastProgressStep = step;
            try { Render(currentAlpha * opacity); }
            catch (Exception ex) { DshActions.Log("render-error " + ex.Message); }
        }
    }

    protected override bool ShowWithoutActivation { get { return true; } }

    protected override CreateParams CreateParams
    {
        get
        {
            var cp = base.CreateParams;
            cp.ExStyle |= 0x00080000; // WS_EX_LAYERED
            cp.ExStyle |= 0x08000000; // WS_EX_NOACTIVATE
            cp.ExStyle |= 0x00000080; // WS_EX_TOOLWINDOW
            return cp;
        }
    }

    protected override void OnShown(EventArgs e)
    {
        base.OnShown(e);
        DshActions.ClearTopmost();
        clock.Start();
        currentAlpha = fadeOn ? 0.0 : 1.0;
        try { Render(currentAlpha * opacity); }
        catch (Exception ex) { DshActions.Log("first-render-error " + ex.Message); }
        uiTimer.Start();
        keepTimer.Start();
        if (soundOn)
        {
            try { System.Media.SystemSounds.Asterisk.Play(); } catch { }
        }
        try { if (ShownCallback != null) ShownCallback(); } catch { }
    }

    public void SaveStatic(string path)
    {
        BuildStatic();
        if (dshMode)
        {
            using (var g = Graphics.FromImage(staticBmp))
            {
                g.SmoothingMode = SmoothingMode.AntiAlias;
                g.TextRenderingHint = TextRenderingHint.AntiAlias;
                DrawDshFooterLabel(g, 1.0);
            }
        }
        staticBmp.Save(path, ImageFormat.Png);
    }
}

public class DshCardSpec
{
    public string id = "";
    public string title = "DeepSeek Harness";
    public string body = "";
    public string status = "";
    public string eyebrow = "";
    public string layout = "bar";
    public string accent = "#1f6beb";
    public string background = "#202020";
    public string text = "#ffffff";
    public string corner = "br";
    public string font = "Microsoft YaHei UI";
    public string monitor = "cursor";
    public string clickAction = "focus";
    public int width = 400;
    public int durationMs = 20000;
    public int marginX = 16;
    public int marginY = 16;
    public int radius = 12;
    public int padX = 20;
    public int padY = 16;
    public int accentWidth = 4;
    public int maxVisible = 3;
    public double opacity = 0.97;
    public double shadow = 0.45;
    public double shine = 0.05;
    public double scale = 1.0;
    public bool sound = false;
    public bool icon = true;
    public bool progress = true;
    public bool fade = true;
    public bool highContrast = false;
    public bool reduceMotion = false;
    public bool suppressForeground = true;
    public bool suppressFullscreen = true;
    public bool respectFocusAssist = true;
}

// A single long-lived PowerShell process owns every card: Add-Type and JIT are
// paid once, and cards can stack, replace and reflow instead of racing each other.
public class DshHost
{
    static readonly JavaScriptSerializer Json = new JavaScriptSerializer();
    static readonly ConcurrentQueue<string> Inbox = new ConcurrentQueue<string>();

    public static void Run()
    {
        try
        {
            Console.OutputEncoding = new UTF8Encoding(false);
            Console.InputEncoding = new UTF8Encoding(false);
        }
        catch { }

        var reader = new Thread(() =>
        {
            try
            {
                string line;
                while ((line = Console.In.ReadLine()) != null) Inbox.Enqueue(line);
            }
            catch { }
            Inbox.Enqueue("__EOF__");
        });
        reader.IsBackground = true;
        reader.Start();

        var form = new HostForm();
        form.ShowInTaskbar = false;
        form.FormBorderStyle = FormBorderStyle.None;
        form.StartPosition = FormStartPosition.Manual;
        form.Size = new Size(1, 1);
        form.Location = new Point(-32000, -32000);
        form.Opacity = 0;
        Application.Run(form);
    }

    public static bool TryRead(out string line)
    {
        return Inbox.TryDequeue(out line);
    }

    public static T Parse<T>(string line) where T : class
    {
        return Json.Deserialize<T>(line);
    }

    public static void Send(object payload)
    {
        try
        {
            Console.Out.WriteLine(Json.Serialize(payload));
            Console.Out.Flush();
        }
        catch { }
    }

    public static void Log(string message)
    {
        DshActions.Log(message);
    }
}

public class HostForm : Form
{
    readonly List<DshToast> cards = new List<DshToast>();
    System.Windows.Forms.Timer pump;
    bool closing;

    public HostForm()
    {
        pump = new System.Windows.Forms.Timer { Interval = 40 };
        pump.Tick += (s, e) => Drain();
        Load += (s, e) =>
        {
            pump.Start();
            DshHost.Send(new Dictionary<string, object> { { "evt", "ready" }, { "pid", Process.GetCurrentProcess().Id } });
            DshHost.Log("host-ready pid=" + Process.GetCurrentProcess().Id);
        };
    }

    void Drain()
    {
        for (int i = 0; i < 20; i++)
        {
            string line;
            if (!DshHost.TryRead(out line)) return;
            if (line == "__EOF__") { Shutdown(); return; }
            if (String.IsNullOrWhiteSpace(line)) continue;
            try { ProcessLine(line); }
            catch (Exception ex)
            {
                DshHost.Log("host-bad-line " + ex.Message);
                DshHost.Send(new Dictionary<string, object> { { "evt", "error" }, { "id", "" }, { "message", ex.Message } });
            }
        }
    }

    void ProcessLine(string line)
    {
        var msg = DshHost.Parse<Dictionary<string, object>>(line);
        if (msg == null) return;
        object cmdValue;
        string cmd = msg.TryGetValue("cmd", out cmdValue) && cmdValue != null ? cmdValue.ToString() : "show";
        if (cmd == "quit") { Shutdown(); return; }
        if (cmd == "ping") { DshHost.Send(new Dictionary<string, object> { { "evt", "pong" } }); return; }
        if (cmd == "clear") { CloseAll("cleared"); return; }
        if (cmd != "show") return;

        var spec = DshHost.Parse<DshCardSpec>(line);
        if (spec == null) return;
        if (String.IsNullOrEmpty(spec.id)) spec.id = "c" + DateTime.Now.Ticks;

        string reason = SuppressionReason(spec);
        if (reason != null)
        {
            DshHost.Log("suppressed id=" + spec.id + " reason=" + reason);
            DshHost.Send(new Dictionary<string, object> { { "evt", "skipped" }, { "id", spec.id }, { "reason", reason } });
            return;
        }

        int maxVisible = Math.Max(1, Math.Min(5, spec.maxVisible));
        while (cards.Count >= maxVisible)
        {
            var oldest = cards[cards.Count - 1];
            DshHost.Log("evict id=" + spec.id + " reason=max-visible");
            oldest.CloseReason = "replaced";
            oldest.Close();
        }

        ApplyStyleEnv(spec);
        DshToast card;
        try
        {
            card = new DshToast(spec.title, spec.body, spec.durationMs);
        }
        catch (Exception ex)
        {
            DshHost.Log("host-create-error " + ex.Message);
            DshHost.Send(new Dictionary<string, object> { { "evt", "error" }, { "id", spec.id }, { "message", ex.Message } });
            return;
        }

        string cardId = spec.id;
        card.ShownCallback = () => DshHost.Send(new Dictionary<string, object> { { "evt", "shown" }, { "id", cardId } });
        card.FormClosed += (s, e) =>
        {
            cards.Remove(card);
            Relayout();
            DshHost.Send(new Dictionary<string, object>
            {
                { "evt", "dismissed" },
                { "id", cardId },
                { "by", String.IsNullOrEmpty(card.CloseReason) ? "closed" : card.CloseReason }
            });
        };

        cards.Insert(0, card);
        Relayout();
        try
        {
            card.Show();
            DshHost.Log("host-show id=" + spec.id + " count=" + cards.Count);
        }
        catch (Exception ex)
        {
            DshHost.Log("host-show-error " + ex.Message);
            DshHost.Send(new Dictionary<string, object> { { "evt", "error" }, { "id", spec.id }, { "message", ex.Message } });
        }
    }

    string SuppressionReason(DshCardSpec spec)
    {
        int state = DshActions.NotificationState();
        if (spec.suppressFullscreen && (state == 2 || state == 3 || state == 4 || state == 7)) return "fullscreen";
        if (spec.respectFocusAssist && state == 6) return "quiet";
        if (spec.suppressForeground && DshActions.IsDshForeground()) return "foreground";
        return null;
    }

    void Relayout()
    {
        int offset = 0;
        foreach (var card in cards)
        {
            card.ApplyStackOffset(offset);
            offset += Math.Max(1, card.WindowHeight) + 2;
        }
    }

    void CloseAll(string reason)
    {
        var copy = new List<DshToast>(cards);
        foreach (var card in copy)
        {
            card.CloseReason = reason;
            try { card.Close(); } catch { }
        }
    }

    void Shutdown()
    {
        if (closing) return;
        closing = true;
        CloseAll("shutdown");
        DshHost.Send(new Dictionary<string, object> { { "evt", "bye" } });
        pump.Stop();
        Application.Exit();
    }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        closing = true;
        CloseAll("shutdown");
        base.OnFormClosing(e);
    }

    static void SetEnv(string name, string value)
    {
        try { Environment.SetEnvironmentVariable(name, String.IsNullOrEmpty(value) ? null : value); } catch { }
    }

    static string Flag(bool value) { return value ? "1" : "0"; }

    static void ApplyStyleEnv(DshCardSpec s)
    {
        SetEnv("DSH_NOTIFY_TITLE", s.title);
        SetEnv("DSH_NOTIFY_BODY", s.body);
        SetEnv("DSH_NOTIFY_STATUS", s.status);
        SetEnv("DSH_NOTIFY_EYEBROW", s.eyebrow);
        SetEnv("DSH_NOTIFY_LAYOUT", s.layout);
        SetEnv("DSH_NOTIFY_ACCENT", s.accent);
        SetEnv("DSH_NOTIFY_BG", s.background);
        SetEnv("DSH_NOTIFY_TEXT", s.text);
        SetEnv("DSH_NOTIFY_CORNER", s.corner);
        SetEnv("DSH_NOTIFY_FONT", s.font);
        SetEnv("DSH_NOTIFY_MONITOR", s.monitor);
        SetEnv("DSH_NOTIFY_CLICK_ACTION", s.clickAction);
        SetEnv("DSH_NOTIFY_WIDTH", s.width.ToString());
        SetEnv("DSH_NOTIFY_MS", s.durationMs.ToString());
        SetEnv("DSH_NOTIFY_MX", s.marginX.ToString());
        SetEnv("DSH_NOTIFY_MY", s.marginY.ToString());
        SetEnv("DSH_NOTIFY_RADIUS", s.radius.ToString());
        SetEnv("DSH_NOTIFY_PADX", s.padX.ToString());
        SetEnv("DSH_NOTIFY_PADY", s.padY.ToString());
        SetEnv("DSH_NOTIFY_ACCENT_W", s.accentWidth.ToString());
        SetEnv("DSH_NOTIFY_OPACITY", s.opacity.ToString(System.Globalization.CultureInfo.InvariantCulture));
        SetEnv("DSH_NOTIFY_SHADOW", s.shadow.ToString(System.Globalization.CultureInfo.InvariantCulture));
        SetEnv("DSH_NOTIFY_SHINE", s.shine.ToString(System.Globalization.CultureInfo.InvariantCulture));
        SetEnv("DSH_NOTIFY_SCALE", s.scale.ToString(System.Globalization.CultureInfo.InvariantCulture));
        SetEnv("DSH_NOTIFY_SOUND", Flag(s.sound));
        SetEnv("DSH_NOTIFY_ICON", Flag(s.icon));
        SetEnv("DSH_NOTIFY_PROGRESS", Flag(s.progress));
        SetEnv("DSH_NOTIFY_FADE", Flag(s.fade));
        SetEnv("DSH_NOTIFY_HIGH_CONTRAST", Flag(s.highContrast));
        SetEnv("DSH_NOTIFY_REDUCE_MOTION", Flag(s.reduceMotion));
    }
}
'@

[DshActions]::LogPath = $logPath

if ($Serve) {
    try { [DshDpi]::EnablePerMonitorV2() | Out-Null } catch { }
    [DshHost]::Run()
    exit 0
}

if ($Diagnose) {
    foreach ($line in [DshActions]::DumpWindows()) { [DshActions]::Log($line) }
    exit 0
}

if ($Snapshot) {
    try { [DshDpi]::EnablePerMonitorV2() | Out-Null } catch { }
    $form = New-Object DshToast($title, $body, $timeoutMs)
    $form.SaveStatic($Snapshot)
    $form.Dispose()
    exit 0
}

if (-not $Quiet) {
    try { [DshDpi]::EnablePerMonitorV2() | Out-Null } catch { }
    $form = New-Object DshToast($title, $body, $timeoutMs)
    [System.Windows.Forms.Application]::Run($form)
}
