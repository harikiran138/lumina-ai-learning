from dotenv import load_dotenv
import streamlit as st
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
import os 
import requests
import json
import time
from typing import Optional

def main():
    load_dotenv()
    st.set_page_config(
        page_title="Ask your PDF with OpenRouter AI",
        page_icon="🤖",
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    # Sidebar for configuration
    with st.sidebar:
        st.title("⚙️ Configuration")
        
        # Check if API key is available
        openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        if openrouter_api_key:
            st.success("✅ API Key loaded")
        else:
            st.error("❌ No API key found")
            st.info("Please set your OpenRouter API key in the .env file")
            return
        
        # Model selection with better descriptions
        st.subheader("🤖 Select AI Model")
        available_models = {
            "GPT-4o (Best Quality)": "openai/gpt-4o",
            "GPT-4 Turbo": "openai/gpt-4-turbo",
            "GPT-3.5 Turbo (Fast)": "openai/gpt-3.5-turbo",
            "Claude 3.5 Sonnet": "anthropic/claude-3.5-sonnet",
            "Claude 3 Haiku (Fast)": "anthropic/claude-3-haiku",
            "Llama 3.1 405B": "meta-llama/llama-3.1-405b-instruct",
            "Llama 3.1 70B": "meta-llama/llama-3.1-70b-instruct",
            "Gemini Pro 1.5": "google/gemini-pro-1.5",
            "Mistral Large": "mistralai/mistral-large"
        }
        
        selected_model_name = st.selectbox(
            "Choose your preferred model:",
            list(available_models.keys()),
            index=0,
            help="Different models have different strengths. GPT-4o offers the best quality, while faster models are good for quick responses."
        )
        selected_model = available_models[selected_model_name]
        
        # Advanced settings
        st.subheader("🎛️ Advanced Settings")
        temperature = st.slider("Temperature (Creativity)", 0.0, 1.0, 0.3, 0.1, 
                               help="Lower values make responses more focused, higher values more creative")
        max_tokens = st.slider("Max Response Length", 500, 2000, 1000, 100)
        chunk_size = st.slider("Text Chunk Size", 500, 2000, 1000, 100)
        num_chunks = st.slider("Number of Chunks to Use", 1, 10, 3, 1)
    
    # Main content
    st.title("📄 Ask your PDF with OpenRouter AI")
    st.markdown("Upload a PDF and ask questions about its content using powerful AI models!")
    
    pdf = st.file_uploader("📁 Upload your PDF", type="pdf", help="Select a PDF file to analyze")

    if pdf is not None:
        # Create columns for better layout
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.subheader("📖 Document Processing")
            
        with col2:
            st.subheader("📊 Stats")
        
        with st.spinner("🔄 Processing PDF... This may take a moment."):
            try:
                # Extract text from PDF
                pdf_reader = PdfReader(pdf)
                text = ""
                total_pages = len(pdf_reader.pages)
                
                progress_bar = st.progress(0)
                for i, page in enumerate(pdf_reader.pages):
                    text += page.extract_text()
                    progress_bar.progress((i + 1) / total_pages)
                
                # Display stats
                with col2:
                    st.metric("Pages", total_pages)
                    st.metric("Characters", len(text))
                    st.metric("Words (approx)", len(text.split()))

                # Split text into chunks with better method
                text_splitter = RecursiveCharacterTextSplitter(
                    separators=["\n\n", "\n", " ", ""],
                    chunk_size=chunk_size,
                    chunk_overlap=200,
                    length_function=len
                )
                chunks = text_splitter.split_text(text)
                
                with col2:
                    st.metric("Text Chunks", len(chunks))

                # Create embeddings using optimized HuggingFace model
                with st.spinner("🧠 Creating embeddings..."):
                    embeddings = HuggingFaceEmbeddings(
                        model_name="sentence-transformers/all-MiniLM-L6-v2",
                        model_kwargs={'device': 'cpu'},
                        encode_kwargs={'normalize_embeddings': True}
                    )
                    
                    # Create vector store with progress
                    knowledge_base = FAISS.from_texts(chunks, embeddings)
                    
                    # Store in session state for reuse
                    st.session_state.knowledge_base = knowledge_base
                    st.session_state.chunks_count = len(chunks)
                
                with col1:
                    st.success("✅ PDF processed successfully! You can now ask questions.")
                
            except Exception as e:
                st.error(f"❌ Error processing PDF: {str(e)}")
                return

        # Enhanced question input section
        st.subheader("❓ Ask Your Question")
        
        # Sample questions for better UX
        with st.expander("💡 Sample Questions"):
            st.write("Try asking questions like:")
            st.write("• What is the main topic of this document?")
            st.write("• Can you summarize the key points?")
            st.write("• What are the conclusions mentioned?")
            st.write("• Are there any specific recommendations?")
        
        user_question = st.text_input(
            "Type your question here:",
            placeholder="e.g., What are the main findings in this document?",
            help="Ask any question about the content of your uploaded PDF"
        )
        
        # Enhanced question processing
        if user_question and (st.session_state.get('knowledge_base') is not None):
            with st.spinner("🤔 Thinking... Generating your answer..."):
                try:
                    start_time = time.time()
                    
                    # Search for relevant documents with progress
                    with st.spinner(f"🔍 Searching through {st.session_state.chunks_count} chunks..."):
                        docs = st.session_state.knowledge_base.similarity_search(
                            user_question, 
                            k=num_chunks
                        )
                    
                    # Combine relevant chunks intelligently
                    context = "\n\n".join([f"Chunk {i+1}:\n{doc.page_content}" 
                                         for i, doc in enumerate(docs)])
                    
                    # Create optimized prompt for OpenRouter API
                    prompt = f"""You are a helpful AI assistant analyzing a PDF document. Based on the following context from the document, please provide a comprehensive and accurate answer to the user's question.

CONTEXT FROM DOCUMENT:
{context}

USER QUESTION: {user_question}

INSTRUCTIONS:
1. Answer based ONLY on the information provided in the context above
2. If the context doesn't contain enough information to answer the question, say so clearly
3. Be specific and cite relevant parts of the document when possible
4. Structure your answer clearly with bullet points or paragraphs as appropriate
5. If you find conflicting information, mention it

ANSWER:"""

                    # Call OpenRouter API with retry logic
                    with st.spinner(f"🚀 Getting response from {selected_model_name}..."):
                        response = call_openrouter_api_with_retry(
                            openrouter_api_key, 
                            selected_model, 
                            prompt,
                            temperature,
                            max_tokens
                        )
                    
                    end_time = time.time()
                    
                    if response:
                        # Create response layout
                        st.subheader("🎯 Answer")
                        
                        # Display response in a nice container
                        with st.container():
                            st.markdown(f"**Model:** {selected_model_name}")
                            st.markdown(f"**Response Time:** {end_time - start_time:.2f} seconds")
                            st.markdown("---")
                            st.write(response)
                        
                        # Show confidence and sources
                        with st.expander(f"📚 Source Material ({len(docs)} chunks used)"):
                            for i, doc in enumerate(docs):
                                st.markdown(f"**📄 Chunk {i+1}:**")
                                st.write(doc.page_content)
                                st.markdown("---")
                                
                        # Feedback section
                        st.subheader("📝 Feedback")
                        col1, col2, col3 = st.columns(3)
                        with col1:
                            if st.button("👍 Helpful"):
                                st.success("Thanks for your feedback!")
                        with col2:
                            if st.button("👎 Not Helpful"):
                                st.info("We'll work on improving our responses!")
                        with col3:
                            if st.button("🔄 Try Different Model"):
                                st.info("Try selecting a different AI model from the sidebar!")
                    else:
                        st.error("❌ Failed to get response from AI model. Please try again.")
                            
                except Exception as e:
                    st.error(f"❌ Error generating answer: {str(e)}")
                    st.info("Try rephrasing your question or selecting a different model.")
        
        elif user_question and st.session_state.get('knowledge_base') is None:
            st.warning("⚠️ Please upload and process a PDF first!")

def call_openrouter_api_with_retry(api_key: str, model: str, prompt: str, 
                                  temperature: float = 0.3, max_tokens: int = 1000, 
                                  max_retries: int = 3) -> Optional[str]:
    """Call OpenRouter API with retry logic and better error handling"""
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/your-app",  # Optional: for analytics
        "X-Title": "PDF Question Answering App"  # Optional: for analytics
    }
    
    data = {
        "model": model,
        "messages": [
            {
                "role": "system", 
                "content": "You are a helpful AI assistant that answers questions based on PDF document content. Be accurate, concise, and cite specific information when possible."
            },
            {
                "role": "user", 
                "content": prompt
            }
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0
    }
    
    for attempt in range(max_retries):
        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=data,
                timeout=60  # Increased timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # Check if response has the expected structure
                if "choices" in result and len(result["choices"]) > 0:
                    content = result["choices"][0]["message"]["content"]
                    return content.strip()
                else:
                    st.error("Unexpected API response structure")
                    return None
                    
            elif response.status_code == 429:  # Rate limit
                wait_time = 2 ** attempt  # Exponential backoff
                st.warning(f"Rate limit reached. Waiting {wait_time} seconds before retry...")
                time.sleep(wait_time)
                continue
                
            elif response.status_code == 401:
                st.error("❌ Invalid API key. Please check your OpenRouter API key.")
                return None
                
            elif response.status_code == 402:
                st.error("❌ Insufficient credits. Please add credits to your OpenRouter account.")
                return None
                
            else:
                error_msg = f"API Error: {response.status_code}"
                try:
                    error_detail = response.json().get("error", {}).get("message", "Unknown error")
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text}"
                
                if attempt == max_retries - 1:  # Last attempt
                    st.error(error_msg)
                    return None
                else:
                    st.warning(f"{error_msg}. Retrying... (Attempt {attempt + 1}/{max_retries})")
                    time.sleep(1)
                    
        except requests.exceptions.Timeout:
            if attempt == max_retries - 1:
                st.error("❌ Request timed out. Please try again with a shorter question or different model.")
                return None
            else:
                st.warning(f"Request timed out. Retrying... (Attempt {attempt + 1}/{max_retries})")
                time.sleep(2)
                
        except requests.exceptions.RequestException as e:
            if attempt == max_retries - 1:
                st.error(f"❌ Network error: {str(e)}")
                return None
            else:
                st.warning(f"Network error. Retrying... (Attempt {attempt + 1}/{max_retries})")
                time.sleep(2)
                
        except Exception as e:
            st.error(f"❌ Unexpected error: {str(e)}")
            return None
    
    return None


def call_openrouter_api(api_key, model, prompt):
    """Legacy function - kept for compatibility"""
    return call_openrouter_api_with_retry(api_key, model, prompt)

if __name__ == '__main__':
    main()