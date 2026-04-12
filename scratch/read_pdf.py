import PyPDF2

def extract_text_from_pdf(pdf_path):
    text = ""
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        for page_num in range(len(reader.pages)):
            page = reader.pages[page_num]
            text += page.extract_text() + "\n"
    return text

with open('scratch/pdf_output.txt', 'w', encoding='utf-8') as f:
    f.write(extract_text_from_pdf('card Info.pdf'))
