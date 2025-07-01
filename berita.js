// berita.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
    const publicNewsList = document.getElementById("publicNewsList");
    const newsModal = document.getElementById("newsModal");
    const closeModal = document.getElementById("closeModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalImage = document.getElementById("modalImage");
    const modalContent = document.getElementById("modalContent");
    const noNewsMessage = document.getElementById("noNewsMessage");

    async function loadPublicNews() {
        const { data, error } = await supabase.from("berita").select("*").order("created_at", { ascending: false });

        if (error) {
            console.error("Error loading public news:", error.message);
            publicNewsList.innerHTML = '';
            noNewsMessage.classList.remove("hidden");
            return;
        }

        publicNewsList.innerHTML = ""; // Clear existing news

        if (data.length === 0) {
            noNewsMessage.classList.remove("hidden");
        } else {
            noNewsMessage.classList.add("hidden");
            data.forEach((berita, index) => {
                const newsCard = document.createElement("div");
                // Tailwind classes for the card
                newsCard.className = "bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 flex flex-col animate-fade-in";
                newsCard.style.animationDelay = `${0.2 * (index + 1)}s`;

                const truncatedContent = berita.konten.length > 150 ? berita.konten.substring(0, 150) + "..." : berita.konten;

                newsCard.innerHTML = `
                    <img src="${berita.gambar_url}" class="w-full h-60 object-cover border-b border-gray-200 transition-transform duration-300 group-hover:scale-105" alt="${berita.judul}">
                    <div class="p-6 flex flex-col flex-grow">
                        <h5 class="font-merriweather text-2xl font-bold text-gray-800 mb-3 leading-tight">${berita.judul}</h5>
                        <p class="text-gray-700 text-base mb-5 flex-grow overflow-hidden text-ellipsis">${truncatedContent}</p>
                        <button class="btn-read-more bg-blue-900 text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors duration-300 hover:bg-blue-800 self-start shadow-md hover:shadow-lg" data-id="${berita.id}">Baca Selengkapnya</button>
                    </div>
                `;
                publicNewsList.appendChild(newsCard);
            });

            // Add event listeners for "Baca Selengkapnya" buttons AFTER they are rendered
            document.querySelectorAll(".btn-read-more").forEach((button) => {
                button.addEventListener("click", (event) => {
                    const newsId = event.target.dataset.id;
                    showNewsDetail(newsId);
                });
            });
        }
    }

    async function showNewsDetail(id) {
        const { data, error } = await supabase.from("berita").select("*").eq("id", id).single();

        if (error) {
            console.error("Error loading news detail:", error.message);
            return;
        }

        modalTitle.textContent = data.judul;
        modalImage.src = data.gambar_url;
        modalImage.alt = data.judul;
        modalContent.textContent = data.konten;
        newsModal.classList.remove("hidden"); // Show modal by removing 'hidden'
        document.body.style.overflow = "hidden"; // Prevent scrolling behind modal
    }

    // Close modal when close button is clicked
    closeModal.addEventListener("click", () => {
        newsModal.classList.add("hidden"); // Hide modal by adding 'hidden'
        document.body.style.overflow = "auto"; // Restore scrolling
    });

    // Close modal when clicking outside of the modal content
    window.addEventListener("click", (event) => {
        if (event.target === newsModal) {
            newsModal.classList.add("hidden");
            document.body.style.overflow = "auto";
        }
    });

    // Initial load of public news
    loadPublicNews();
});