from dotenv import load_dotenv
import streamlit as st
from PyPDF2 import PdfReader
from langchain.text_splitter import CharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain.chains.question_answering import load_qa_chain
import os 

def main():
    load_dotenv()
    st.set_page_config(page_title="Ask your PDF with Gemini AI")
    st.header("Ask your PDF with Gemini AI 🤖")
    
    # Check if API key is available
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key:
        st.error("Please set your GOOGLE_API_KEY in the .env file")
        st.info("Get your API key from: https://makersuite.google.com/app/apikey")
        return
    
    pdf = st.file_uploader("Upload your PDF", type="pdf")

    if pdf is not None:
        with st.spinner("Processing PDF..."):
            pdf_reader = PdfReader(pdf)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()

            # Split text into chunks
            text_splitter = CharacterTextSplitter(
                separator="\n",
                chunk_size=1000,
                chunk_overlap=200,
                length_function=len
            )
            chunks = text_splitter.split_text(text)

            # Create embeddings using Gemini
            try:
                embeddings = GoogleGenerativeAIEmbeddings(
                    model="models/embedding-001",
                    google_api_key=google_api_key
                )
                
                # Create vector store
                knowledge_base = FAISS.from_texts(chunks, embeddings)
                
                # Initialize Gemini model
                llm = ChatGoogleGenerativeAI(
                    model="gemini-pro",
                    google_api_key=google_api_key,
                    temperature=0.3
                )
                
                st.success("PDF processed successfully! You can now ask questions.")
                
            except Exception as e:
                st.error(f"Error initializing Gemini AI: {str(e)}")
                return

        # User question input
        user_question = st.text_input("Ask a question about your PDF:")
        
        if user_question:
            with st.spinner("Generating answer..."):
                try:
                    # Search for relevant documents
                    docs = knowledge_base.similarity_search(user_question, k=3)
                    
                    # Create QA chain
                    chain = load_qa_chain(llm, chain_type="stuff")
                    
                    # Get response
                    response = chain.run(input_documents=docs, question=user_question)
                    
                    # Display response
                    st.subheader("Answer:")
                    st.write(response)
                    
                    # Show relevant chunks (optional)
                    with st.expander("View relevant document chunks"):
                        for i, doc in enumerate(docs):
                            st.write(f"**Chunk {i+1}:**")
                            st.write(doc.page_content)
                            st.write("---")
                            
                except Exception as e:
                    st.error(f"Error generating answer: {str(e)}")

if __name__ == '__main__':
    main()