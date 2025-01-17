import { API_BASE_URL } from "../../config/apiConfig.js";
import { getFromLocalStorage } from "../utils/storage.js";

const boardsList = document.getElementById("boardsList");
const userNameSpan = document.getElementById("userName");
const logoutButton = document.getElementById("logoutButton");
const boardTitle = document.getElementById("boardTitle");
const boardLayout = document.getElementById("board");

let currentBoardId = null; // Variável para armazenar o ID do board atual

async function loadBoards() {
    try {
        const response = await fetch(`${API_BASE_URL}/Boards`);
        if (!response.ok) {
            throw new Error("Erro ao carregar boards");
        }
        const boards = await response.json();
        populateBoardsDropdown(boards);
    } catch (error) {
        console.error("Erro ao carregar boards:", error);
    }
}

function populateBoardsDropdown(boards) {
    boards.forEach((board) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `<a class="dropdown-item" id="dropdown-item" value="${board.Id}">${board.Name}</a>`;
        listItem.addEventListener("click", (event) => {
            boardTitle.innerHTML = event.target.innerHTML;
            currentBoardId = board.Id; // Armazena o ID do board selecionado
            loadBoard(board.Id);
        });
        boardsList.appendChild(listItem);
    });
}

async function loadBoard(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/ColumnByBoardId?BoardId=${id}`);
        if (!response.ok) {
            throw new Error("Erro ao carregar colunas");
        }
        const columns = await response.json();
        populateColumns(columns);
    } catch (error) {
        console.error("Erro ao carregar colunas:", error);
    }
}

function populateColumns(columns) {
    boardLayout.innerHTML = "";

    columns.forEach((column) => {
        const columnItem = document.createElement("article");
        columnItem.className = "column-item";
        columnItem.dataset.columnId = column.Id;

        const columnHeader = document.createElement("header");
        columnHeader.className = "column-header";
        columnHeader.innerHTML = `
            <h5>${column.Name}</h5>
            <button class="delete-column-btn">Excluir Coluna</button>
            <button class="add-task-btn">Adicionar Tarefa</button>
        `;

        const columnBody = document.createElement("div");
        columnBody.className = "column-body";
        columnBody.id = `tasks-${column.Id}`;

        columnItem.appendChild(columnHeader);
        columnItem.appendChild(columnBody);
        boardLayout.appendChild(columnItem);

        // Carregar as tarefas da coluna
        fetchTasksByColumn(column.Id).then((res) => {
            addTasksToColumn(column.Id, res);
        });

        // Evento para excluir coluna
        columnHeader.querySelector(".delete-column-btn").addEventListener("click", async () => {
            console.log("Botão de excluir clicado para a coluna:", column.Name, column.Id); // Log para verificar os valores
            const confirmDelete = confirm(`Tem certeza de que deseja excluir a coluna "${column.Name}"?`);
            
            if (confirmDelete) {
                try {
                    console.log(`Tentando excluir a coluna com ID: ${column.Id}`); // Log para verificar se a requisição está sendo feita
                    await deleteColumn(column.Id);
                    console.log(`Coluna com ID: ${column.Id} excluída com sucesso`);
                    // Após excluir a coluna da API, remove a coluna da interface
                    columnItem.remove();
                } catch (error) {
                    console.error("Erro ao excluir a coluna:", error);
                }
            } else {
                console.log(`Exclusão da coluna "${column.Name}" cancelada`);
            }
        });
        
        // Evento para adicionar tarefa
        columnHeader.querySelector(".add-task-btn").addEventListener("click", () => {
            console.log(`Adicionando tarefa à coluna ${column.Name}`); // Log para depuração
            addTask(column.Id);
        });
    }); // Aqui é necessário fechar o forEach corretamente.
}
//funcao pra excluir a coluna

//funcao pra criar task e salvar
function fetchTasksByColumn(columnId) {
    const endpoint = `${API_BASE_URL}/TaskBoard_CS/rest/TaskBoard/TasksByColumnId?ColumnId=${columnId}`;
    return fetch(endpoint)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Erro ao buscar tasks para ColumnId ${columnId}: ${response.status}`);
            }
            return response.json();
        })
        .catch((error) => {
            console.error(error);
            return [];
        });
}

// Função para adicionar uma tarefa
async function addTask(columnId) {
    const taskTitle = prompt("Digite o título da nova tarefa:");
    if (!taskTitle) return; // Se não houver título, retorna sem fazer nada

    // 1. Cria a tarefa localmente (na interface)
    const columnBody = document.getElementById(`tasks-${columnId}`);
    const taskItem = document.createElement("div");
    taskItem.className = "task-item";
    taskItem.innerHTML = `
        <h6>${taskTitle}</h6>
        <button class="delete-task-btn">Excluir Tarefa</button>
    `;
    taskItem.querySelector(".delete-task-btn").addEventListener("click", () => {
        taskItem.remove();
    });

    columnBody.appendChild(taskItem);

    try {
        // 2. Tenta salvar a tarefa na API
        await addTaskToColumn(columnId, taskTitle);
    } catch (error) {
        console.error("Erro ao salvar a tarefa na API:", error);
        alert("Não foi possível salvar a tarefa. Tente novamente mais tarde.");
    }
}



//funcao pra criar task e salvar //fim



function loadUserName() {
    const userName = getFromLocalStorage("user");
    console.log(userName);
    if (userName.name) {
        userNameSpan.textContent = `Olá, ${userName.name.split(' ')[0]}`;
    } else {
        userNameSpan.textContent = "Usuário não identificado";
    }
}

logoutButton.addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "index.html";
});

function init() {
    loadUserName();
    loadBoards();
}

init();

//logica de mudar pro dark

function toggleTheme() {
    const isDarkMode = document.getElementById('darkmode-toggle').checked;

    if (isDarkMode) {
        applyTheme('dark');
    } else {
        applyTheme('light');
    }
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    } else if (theme === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', theme);
}

async function loadTheme() {
    try {
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme) {
            applyTheme(savedTheme);
            document.getElementById('darkmode-toggle').checked = savedTheme === 'dark';
        } else {
            const response = await fetch('https://personal-ga2xwx9j.outsystemscloud.com/TaskBoard_CS/rest/TaskBoard/Themes');
            const data = await response.json();
            const activeTheme = data.find(theme => theme.Is_Active);

            if (activeTheme) {
                const themeLabel = activeTheme.Label.toLowerCase();
                applyTheme(themeLabel);
                document.getElementById('darkmode-toggle').checked = themeLabel === 'dark';
            }
        }
    } catch (error) {
        console.error('Erro ao carregar o tema:', error.message);
    }
}

document.getElementById('darkmode-toggle').addEventListener('change', toggleTheme);
loadTheme();
// acabo logica de mudar pro dark

const taskBoardContainer = document.getElementById('task-board-container');
const createColumnBtn = document.getElementById('create-column');

// Função para adicionar coluna e salvar na API
async function addColumn(columnName) {
    if (!currentBoardId) {
        alert("Nenhum board selecionado.");
        return;
    }

    if (!columnName) {
        alert("O nome da coluna não pode estar vazio.");
        return;
    }

    try {
        const response = await fetch(`https://personal-ga2xwx9j.outsystemscloud.com/TaskBoard_CS/rest/TaskBoard/Column`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boardId: currentBoardId, Name: columnName }), // Aqui estamos usando "Name" em vez de "columnName"
        });

        if (response.ok) {
            const newColumn = await response.json();
            console.log("Coluna adicionada:", newColumn);
            loadBoard(currentBoardId); // Recarrega as colunas após adicionar
        } else {
            throw new Error("Erro ao adicionar coluna");
        }
    } catch (error) {
        console.error("Erro ao adicionar coluna:", error);
    }
}

async function deleteColumn(columnId) {
    try {
        const response = await fetch(`https://personal-ga2xwx9j.outsystemscloud.com/TaskBoard_CS/rest/TaskBoard/Column?ColumnId=${columnId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error("Erro ao excluir a coluna");
        }

        console.log(`Coluna com ID ${columnId} excluída com sucesso!`);
    } catch (error) {
        throw new Error(`Falha ao excluir a coluna com ID ${columnId}: ${error.message}`);
    }
}


createColumnBtn.addEventListener('click', () => {
    const columnName = prompt("Digite o nome da nova coluna:");

    if (!columnName) {
        alert("Nome da coluna inválido.");
        return;
    }

    addColumn(columnName);
});

//funcao pra criar a board
const user = JSON.parse(localStorage.getItem("user"));

if (user && user.id) {
  const userId = user.id; // Aqui está o ID do usuário
  console.log("ID do usuário:", userId);
} else {
  console.error("Usuário não encontrado. Certifique-se de estar logado.");
}


const createBoardButton = document.getElementById('button');
const apiUrl = 'https://personal-ga2xwx9j.outsystemscloud.com/TaskBoard_CS/rest/TaskBoard';

async function createBoard() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
        alert("Erro: ID do usuário não encontrado. Certifique-se de estar logado.");
        return;
    }

    const boardName = prompt("Digite o nome da nova board:");
    if (!boardName) {
        alert("O nome da board não pode estar vazio.");
        return;
    }

    const boardData = {
        name: boardName,
        CreatedBy: user.id, // Utiliza o ID do usuário salvo no localStorage
    };

    try {
        const response = await fetch(`${apiUrl}/Board`, { // Aqui usamos apiUrl em vez de API_BASE_URL
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(boardData),
        });

        if (!response.ok) {
            const errorDetails = await response.json();
             
            throw new Error(`Erro ao criar a board: ${JSON.stringify(errorDetails)}`);
        }

        const board = await response.json();
        
        alert("Board criada com sucesso!");
    } catch (error) {
       
        alert("Erro! Campo Nome deve ter ao menos 10 caractéres.");
    }
}

createBoardButton.addEventListener('click', createBoard);
//fim da funcao de criar a board


// Função para buscar todas as tarefas

async function fetchAllTasks() {
    const url = "https://personal-ga2xwx9j.outsystemscloud.com/TaskBoard_CS/rest/TaskBoard/Task";

    try {
        // Faz a requisição GET para buscar todas as tarefas
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Erro ao buscar tarefas: ${response.status}`);
        }

        // Converte a resposta para JSON
        const tasks = await response.json();

        // Exibe as tarefas
        displayTasks(tasks);
    } catch (error) {
        console.error("Erro ao obter as tarefas:", error);
        alert("Não foi possível carregar as tarefas. Verifique o console para mais detalhes.");
    }
}

// Função para exibir as tarefas na interface
function displayTasks(tasks) {
    const taskListElement = document.getElementById("task-list");

    // Limpa a lista de tarefas
    taskListElement.innerHTML = "";

    if (tasks.length === 0) {
        taskListElement.innerHTML = "Nenhuma tarefa encontrada.";
        return;
    }

    // Itera pelas tarefas e cria elementos HTML para exibi-las
    tasks.forEach((task) => {
        const taskItem = document.createElement("div");
        taskItem.className = "task-item";
        taskItem.innerHTML = `
            <h6>${task.Title || "Sem título"}</h6>
            <p>${task.Description || "Sem descrição"}</p>
            <p>Status: ${task.IsActive ? "Ativa" : "Inativa"}</p>
            <p>Criada por: ${task.CreatedBy}</p>
            <p>Última atualização por: ${task.UpdatedBy}</p>
        `;
        taskListElement.appendChild(taskItem);
    });
}

// Chamar a função ao carregar a página
fetchAllTasks();

