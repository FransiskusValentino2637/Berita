import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
    const admin = JSON.parse(localStorage.getItem("admin"));
    if (!admin) {
        window.location.href = "login.html";
        return;
    }

    const formNews = document.getElementById("formNews");
    const judulBeritaInput = document.getElementById("judulBerita");
    const kontenBeritaInput = document.getElementById("kontenBerita");
    const gambarBeritaInput = document.getElementById("gambarBerita");
    const gambarFileName = document.getElementById("gambarFileName");
    const submitNewsBtn = document.getElementById("submitNewsBtn");
    const newsList = document.getElementById("newsList");
    const logoutBtn = document.getElementById("logoutBtn");
    const alertMessage = document.getElementById("alertMessage");
    const noNewsMessage = document.getElementById("noNewsMessage");

    let editingNewsId = null;

    const newsModal = document.getElementById("newsModal");
    const closeModal = document.getElementById("closeModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalImage = document.getElementById("modalImage");
    const modalContent = document.getElementById("modalContent");

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("admin");
        window.location.href = "index.html";
    });

    formNews.addEventListener("submit", handleSubmitNews);

    gambarBeritaInput.addEventListener("change", () => {
        if (gambarBeritaInput.files.length > 0) {
            gambarFileName.textContent = `File dipilih: ${gambarBeritaInput.files[0].name}`;
        } else {
            gambarFileName.textContent = '';
        }
    });

    if (closeModal) {
        closeModal.addEventListener("click", () => {
            newsModal.classList.add("hidden");
            document.body.style.overflow = "auto";
        });
    }

    if (newsModal) {
        window.addEventListener("click", (event) => {
            if (event.target === newsModal) {
                newsModal.classList.add("hidden");
                document.body.style.overflow = "auto";
            }
        });
    }

    function showAlert(message, type) {
        alertMessage.textContent = message;
        alertMessage.className = "p-4 rounded text-sm mt-4 text-center transition";
        alertMessage.classList.remove("hidden");

        if (type === "success") {
            alertMessage.classList.add("bg-green-100", "text-green-800");
        } else if (type === "error") {
            alertMessage.classList.add("bg-red-100", "text-red-800");
        } else if (type === "info") {
            alertMessage.classList.add("bg-blue-100", "text-blue-800");
        }

        setTimeout(() => {
            alertMessage.classList.add("hidden");
        }, 4000);
    }

    async function uploadImage(file) {
        const fileName = `news_images/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
            .from("news-images")
            .upload(fileName, file);

        if (uploadError) {
            showAlert("Gagal mengunggah gambar: " + uploadError.message, "error");
            return null;
        }

        const { data: urlData } = supabase.storage
            .from("news-images")
            .getPublicUrl(fileName);

        return urlData.publicUrl;
    }

    async function deleteImage(imageUrl) {
        if (!imageUrl || !imageUrl.includes('news-images')) return;

        const pathSegments = imageUrl.split('news-images/');
        if (pathSegments.length > 1) {
            const filePath = `news_images/${pathSegments[1]}`;
            const { error } = await supabase.storage.from("news-images").remove([filePath]);

            if (error) {
                console.error("Gagal menghapus gambar:", error.message);
            }
        }
    }

    async function handleSubmitNews(e) {
        e.preventDefault();

        submitNewsBtn.disabled = true;
        submitNewsBtn.textContent = editingNewsId ? 'Memperbarui...' : 'Menyimpan...';

        const judul = judulBeritaInput.value.trim();
        const konten = kontenBeritaInput.value.trim();
        const gambarFile = gambarBeritaInput.files[0];

        if (!judul || !konten) {
            showAlert("Judul dan Konten wajib diisi!", "error");
            submitNewsBtn.disabled = false;
            submitNewsBtn.textContent = editingNewsId ? 'Update Berita' : 'Simpan Berita';
            return;
        }

        let imageUrl = null;

        if (gambarFile) {
            imageUrl = await uploadImage(gambarFile);
            if (!imageUrl) {
                submitNewsBtn.disabled = false;
                submitNewsBtn.textContent = editingNewsId ? 'Update Berita' : 'Simpan Berita';
                return;
            }

            if (editingNewsId) {
                const { data: oldNews } = await supabase
                    .from("berita")
                    .select("gambar_url")
                    .eq("id", editingNewsId)
                    .single();
                if (oldNews?.gambar_url) {
                    await deleteImage(oldNews.gambar_url);
                }
            }
        } else if (editingNewsId) {
            const { data: currentNews, error } = await supabase
                .from("berita")
                .select("gambar_url")
                .eq("id", editingNewsId)
                .single();
            if (error) {
                showAlert("Gagal mendapatkan gambar lama.", "error");
                submitNewsBtn.disabled = false;
                return;
            }
            imageUrl = currentNews.gambar_url;
        } else {
            showAlert("Harap unggah gambar.", "error");
            submitNewsBtn.disabled = false;
            return;
        }

        if (editingNewsId) {
            const { error: updateError } = await supabase
                .from("berita")
                .update({ judul, konten, gambar_url: imageUrl })
                .eq("id", editingNewsId)
                .select(); // ✅ tanpa .single()

            if (updateError) {
                showAlert("Gagal memperbarui berita.", "error");
            } else {
                showAlert("Berita diperbarui!", "success");
                resetForm();
            }
        } else {
            const { error: insertError } = await supabase
                .from("berita")
                .insert([{ judul, konten, gambar_url: imageUrl }]);

            if (insertError) {
                showAlert("Gagal menambahkan berita.", "error");
            } else {
                showAlert("Berita ditambahkan!", "success");
                resetForm();
            }
        }

        submitNewsBtn.disabled = false;
        submitNewsBtn.textContent = editingNewsId ? 'Update Berita' : 'Simpan Berita';
        loadNews();
    }

    async function loadNews() {
        const { data, error } = await supabase
            .from("berita")
            .select("*")
            .order("created_at", { ascending: false });

        newsList.innerHTML = "";
        if (error) {
            showAlert("Gagal memuat berita.", "error");
            return;
        }

        if (data.length === 0) {
            noNewsMessage.classList.remove("hidden");
            return;
        }

        noNewsMessage.classList.add("hidden");

        data.forEach((berita) => {
            const card = document.createElement("div");
            card.className = "bg-white p-4 rounded shadow mb-4";

            const truncated = berita.konten.length > 150 ? berita.konten.slice(0, 150) + "..." : berita.konten;

            card.innerHTML = `
                <img src="${berita.gambar_url}" class="w-full h-48 object-cover rounded mb-2" />
                <h5 class="text-xl font-bold mb-1">${berita.judul}</h5>
                <p>${truncated}</p>
                <div class="flex justify-between mt-3">
                    <button class="read-more-btn text-blue-600" data-id="${berita.id}">Baca Selengkapnya</button>
                    <div class="flex gap-2">
                        <button class="edit-btn text-yellow-600" data-id="${berita.id}" data-judul="${berita.judul}" data-konten="${berita.konten}" data-gambar="${berita.gambar_url}">Edit</button>
                        <button class="delete-btn text-red-600" data-id="${berita.id}" data-gambar="${berita.gambar_url}">Hapus</button>
                    </div>
                </div>
            `;

            newsList.appendChild(card);
        });

        document.querySelectorAll(".edit-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const el = e.currentTarget;
                editingNewsId = el.dataset.id;
                judulBeritaInput.value = el.dataset.judul;
                kontenBeritaInput.value = el.dataset.konten;
                gambarFileName.textContent = `Gambar saat ini: ${el.dataset.gambar.split("/").pop()}`;
                gambarBeritaInput.required = false;
                submitNewsBtn.textContent = "Update Berita";
                showAlert("Mode Edit: Ubah berita di atas.", "info");
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        });

        document.querySelectorAll(".delete-btn").forEach((btn) => {
            btn.addEventListener("click", async (e) => {
                const id = e.currentTarget.dataset.id;
                const imageUrl = e.currentTarget.dataset.gambar;

                if (confirm("Yakin ingin menghapus?")) {
                    await deleteImage(imageUrl);
                    const { error: deleteError } = await supabase
                        .from("berita")
                        .delete()
                        .eq("id", id)
                        .select(); // ✅ tanpa .single()

                    if (deleteError) {
                        showAlert("Gagal menghapus berita.", "error");
                    } else {
                        showAlert("Berita dihapus.", "success");
                        loadNews();
                    }
                }
            });
        });

        document.querySelectorAll(".read-more-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                showNewsDetail(e.currentTarget.dataset.id);
            });
        });
    }

    async function showNewsDetail(id) {
        const { data, error } = await supabase.from("berita").select("*").eq("id", id).single();
        if (error) {
            showAlert("Gagal memuat detail berita", "error");
            return;
        }

        modalTitle.textContent = data.judul;
        modalImage.src = data.gambar_url;
        modalImage.alt = data.judul;
        modalContent.textContent = data.konten;
        newsModal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
    }

    function resetForm() {
        formNews.reset();
        gambarFileName.textContent = "";
        editingNewsId = null;
        gambarBeritaInput.required = true;
        submitNewsBtn.textContent = "Simpan Berita";
    }

    loadNews();
});
