import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
from app.utils.config import settings

class NumberedCanvas(canvas.Canvas):
    """Custom canvas to draw headers, footers, and page numbers dynamically."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # Primary Color Theme Accent (Deep Navy/Purple)
        primary_color = colors.HexColor("#4F46E5") # Indigo
        text_color = colors.HexColor("#6B7280") # Muted Gray
        
        # Draw Header
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(primary_color)
        self.drawString(54, 750, "MEETMIND")
        
        self.setFont("Helvetica", 8)
        self.setFillColor(text_color)
        self.drawRightString(612 - 54, 750, "AI Meeting Assistant Report")
        
        self.setStrokeColor(colors.HexColor("#E5E7EB"))
        self.setLineWidth(0.75)
        self.line(54, 742, 612 - 54, 742)
        
        # Draw Footer
        self.line(54, 50, 612 - 54, 50)
        self.setFont("Helvetica", 8)
        self.setFillColor(text_color)
        self.drawString(54, 38, f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        self.drawRightString(612 - 54, 38, f"Page {self._pageNumber} of {page_count}")
        
        self.restoreState()

def clean_text_for_pdf(text: str) -> str:
    """Cleans text of smart quotes and unsupported unicode characters to prevent PDF generation errors."""
    if not text:
        return ""
    replacements = {
        "\u201c": '"',
        "\u201d": '"',
        "\u2018": "'",
        "\u2019": "'",
        "\u2013": "-",
        "\u2014": "--",
        "\u2022": "*",
        "☐": "[ ]",
        "☑": "[x]",
        "\u2610": "[ ]", # Ballots
        "\u2611": "[x]"
    }
    for orig, rep in replacements.items():
        text = text.replace(orig, rep)
    # Remove unsupported characters
    return "".join(c for c in text if ord(c) < 128)

def format_duration(seconds: float) -> str:
    """Formats duration in seconds to MM:SS or HH:MM:SS."""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    if h > 0:
        return f"{h}h {m}m {s}s"
    return f"{m}m {s}s"

def generate_meeting_pdf(meeting_title: str, upload_date: datetime, duration: float, 
                         summary_md: str, action_items: list, topics: list, 
                         sentiment: str, sentiment_explanation: str, 
                         transcript_text: str, filename: str) -> str:
    """
    Generates a professional, print-ready meeting report PDF.
    Returns the file path of the generated PDF.
    """
    pdf_filename = f"{filename.split('.')[0]}_{int(datetime.now().timestamp())}.pdf"
    pdf_path = os.path.join(settings.PDF_DIR, pdf_filename)
    
    # Page dimensions setup
    # Margins: Left=54 (0.75 in), Right=54, Top=72 (1 in), Bottom=72
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Brand Palette Styles
    primary_color = colors.HexColor("#4F46E5") # Indigo
    secondary_color = colors.HexColor("#06B6D4") # Cyan/Teal
    dark_neutral = colors.HexColor("#1F2937") # Charcoal
    light_bg = colors.HexColor("#F9FAFB") # Off-white
    border_color = colors.HexColor("#E5E7EB")
    
    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=primary_color,
        spaceAfter=15
    )
    
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=dark_neutral,
        spaceAfter=6
    )
    
    dialog_style = ParagraphStyle(
        'Dialog_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=dark_neutral,
        spaceAfter=4,
        leftIndent=15
    )
    
    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=primary_color
    )
    
    meta_val_style = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=dark_neutral
    )

    story = []
    
    # 1. Document Title
    story.append(Spacer(1, 15))
    story.append(Paragraph(clean_text_for_pdf(meeting_title), title_style))
    story.append(Spacer(1, 10))
    
    # 2. Metadata Grid Table
    formatted_date = upload_date.strftime("%B %d, %Y - %I:%M %p")
    formatted_duration = format_duration(duration)
    
    sentiment_tag = f"<font color='{primary_color.hexval()}'><b>{sentiment}</b></font>"
    if sentiment.lower() == "negative":
        sentiment_tag = "<font color='#EF4444'><b>Negative</b></font>"
    elif sentiment.lower() == "positive":
        sentiment_tag = "<font color='#10B981'><b>Positive</b></font>"
        
    meta_data = [
        [Paragraph("Date:", meta_label_style), Paragraph(clean_text_for_pdf(formatted_date), meta_val_style),
         Paragraph("Duration:", meta_label_style), Paragraph(clean_text_for_pdf(formatted_duration), meta_val_style)],
        [Paragraph("Sentiment:", meta_label_style), Paragraph(sentiment_tag, meta_val_style),
         Paragraph("Topics:", meta_label_style), Paragraph(clean_text_for_pdf(", ".join(topics)), meta_val_style)]
    ]
    
    meta_table = Table(meta_data, colWidths=[70, 180, 60, 194])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, border_color),
        ('BOX', (0,0), (-1,-1), 0.75, border_color)
    ]))
    
    story.append(meta_table)
    story.append(Spacer(1, 15))
    
    # 3. Sentiment Explanation Card (if available)
    if sentiment_explanation:
        sent_style = ParagraphStyle(
            'SentExpl',
            parent=body_style,
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#4B5563")
        )
        sent_data = [[
            Paragraph(f"<b>Sentiment Summary:</b> {clean_text_for_pdf(sentiment_explanation)}", sent_style)
        ]]
        sent_table = Table(sent_data, colWidths=[504])
        sent_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EEF2F6")),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 8),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#D1D5DB")),
        ]))
        story.append(sent_table)
        story.append(Spacer(1, 15))
        
    # 4. Summary Section
    story.append(Paragraph("Meeting Summary", h1_style))
    summary_lines = summary_md.split("\n")
    for line in summary_lines:
        line = line.strip()
        if not line:
            continue
        
        # Simple Markdown parsing
        if line.startswith("###"):
            hdr_text = line.replace("###", "").strip()
            story.append(Paragraph(f"<b>{clean_text_for_pdf(hdr_text)}</b>", ParagraphStyle('SubHdr', parent=body_style, fontSize=10, leading=14, textColor=secondary_color, spaceBefore=8, spaceAfter=4, keepWithNext=True)))
        elif line.startswith("##"):
            hdr_text = line.replace("##", "").strip()
            story.append(Paragraph(f"<b>{clean_text_for_pdf(hdr_text)}</b>", ParagraphStyle('SubHdr2', parent=body_style, fontSize=11, leading=15, textColor=primary_color, spaceBefore=10, spaceAfter=6, keepWithNext=True)))
        elif line.startswith("-") or line.startswith("*"):
            bullet_text = line[1:].strip()
            story.append(Paragraph(f"&bull; {clean_text_for_pdf(bullet_text)}", ParagraphStyle('Bullet_Custom', parent=body_style, leftIndent=12, spaceAfter=3)))
        else:
            story.append(Paragraph(clean_text_for_pdf(line), body_style))
            
    story.append(Spacer(1, 10))
    
    # 5. Action Items Section
    if action_items:
        action_elements = []
        action_elements.append(Paragraph("Action Items", h1_style))
        for item in action_items:
            # Render a check box [ ] or [x] if completed
            bullet = "<font color='#D1D5DB' name='Helvetica'>[ &nbsp; ]</font> &nbsp;"
            action_elements.append(Paragraph(f"{bullet} {clean_text_for_pdf(item)}", ParagraphStyle('Action_Custom', parent=body_style, leftIndent=10, spaceAfter=4)))
        
        # Prevent splitting Action Items across pages if they fit
        story.append(KeepTogether(action_elements))
        story.append(Spacer(1, 10))
        
    # 6. Transcript Section
    story.append(Paragraph("Transcript Log", h1_style))
    transcript_lines = transcript_text.strip().split("\n")
    
    transcript_elements = []
    for line in transcript_lines:
        line = line.strip()
        if not line:
            continue
        # Check if line looks like dialogue "[00:12] Person: Text"
        if line.startswith("[") and ":" in line:
            try:
                timestamp_end = line.find("]")
                timestamp = line[1:timestamp_end]
                rest = line[timestamp_end+1:].strip()
                speaker_end = rest.find(":")
                speaker = rest[:speaker_end]
                dialogue = rest[speaker_end+1:].strip()
                
                formatted_line = f"<font color='{primary_color.hexval()}'><b>{timestamp}</b></font> <font color='#111827'><b>{speaker}:</b></font> {dialogue}"
                transcript_elements.append(Paragraph(clean_text_for_pdf(formatted_line), dialog_style))
            except Exception:
                transcript_elements.append(Paragraph(clean_text_for_pdf(line), body_style))
        else:
            transcript_elements.append(Paragraph(clean_text_for_pdf(line), body_style))
            
    story.extend(transcript_elements)
    
    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    return pdf_path
