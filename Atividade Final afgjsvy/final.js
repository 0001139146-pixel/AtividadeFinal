const SUPABASE_URL = 'https://fjavtftrzebogbsczbqo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqYXZ0ZnRyemVib2dic2N6YnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NTM5NjMsImV4cCI6MjA5OTUyOTk2M30.NvSugEMLt9KPLrMxKcr_Xkr366b1F76yt47YB0WgEL8';

// Usando supabaseClient para evitar conflito
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function mudarAba(idAba) {
    document.querySelectorAll('.aba').forEach(aba => {
        aba.classList.remove('ativa');
    });
    
    document.getElementById(idAba).classList.add('ativa');

    if(idAba === 'dashboard') carregarEstoque();
    if(idAba === 'movimentacao') carregarSelectProdutos();
}

async function carregarEstoque() {
    const tbody = document.getElementById('tabela-estoque');
    tbody.innerHTML = '<tr><td colspan="4">Carregando dados...</td></tr>';

    const { data: produtos, error } = await supabaseClient
        .from('produtos')
        .select(`id, nome, unidade_medida, data_validade, movimentacoes(tipo, quantidade)`);

    if (error) {
        console.error('Erro ao buscar estoque:', error);
        tbody.innerHTML = '<tr><td colspan="4">Erro ao buscar dados.</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    produtos.forEach(produto => {
        let entradas = 0;
        let saidas = 0;

        if (produto.movimentacoes) {
            produto.movimentacoes.forEach(mov => {
                if (mov.tipo === 'ENTRADA') entradas += Number(mov.quantidade);
                if (mov.tipo === 'SAIDA') saidas += Number(mov.quantidade);
            });
        }

        const estoqueAtual = entradas - saidas;

        let validade = 'N/A';
        if (produto.data_validade) {
            // Ajustando a data para o formato brasileiro
            // O "+ 'T00:00:00'" corrige o fuso horário para a data não voltar 1 dia
            validade = new Date(produto.data_validade + 'T00:00:00').toLocaleDateString('pt-BR');
        }

        tbody.innerHTML += `
            <tr>
                <td><strong>${produto.nome}</strong></td>
                <td style="color: ${estoqueAtual <= 0 ? 'red' : 'green'}; font-weight: bold;">
                    ${estoqueAtual}
                </td>
                <td>${produto.unidade_medida}</td>
                <td>${validade}</td>
            </tr>
        `;
    });
}

document.getElementById('form-produto').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('nome-produto').value;
    const categoria = document.getElementById('categoria').value;
    const unidade = document.getElementById('unidade').value;
    
    // Captura a data de validade
    const validadeInput = document.getElementById('validade').value;
    const dataValidade = validadeInput ? validadeInput : null;

    const { error } = await supabaseClient
        .from('produtos')
        .insert([{ 
            nome: nome, 
            categoria: categoria, 
            unidade_medida: unidade,
            data_validade: dataValidade
        }]);

    if (error) {
        console.error("Motivo do erro no banco:", error);
        alert('Erro ao salvar produto! Verifique o console (F12).');
    } else {
        alert('Produto salvo com sucesso!');
        document.getElementById('form-produto').reset();
    }
});

async function carregarSelectProdutos() {
    const select = document.getElementById('select-produto');
    const { data, error } = await supabaseClient.from('produtos').select('id, nome');
    
    if (!error) {
        select.innerHTML = '';
        data.forEach(prod => {
            select.innerHTML += `<option value="${prod.id}">${prod.nome}</option>`;
        });
    } else {
        console.error("Erro ao carregar produtos no select:", error);
    }
}

document.getElementById('form-movimentacao').addEventListener('submit', async (e) => {
    e.preventDefault();

    const produto_id = document.getElementById('select-produto').value;
    const tipo = document.getElementById('tipo-movimentacao').value;
    const quantidade = document.getElementById('quantidade').value;

    const { error } = await supabaseClient
        .from('movimentacoes')
        .insert([{ produto_id, tipo, quantidade }]);

    if (error) {
        console.error("Motivo do erro no banco:", error);
        alert('Erro ao registrar movimentação! Verifique o console (F12).');
    } else {
        alert('Movimentação registrada com sucesso!');
        document.getElementById('form-movimentacao').reset();
    }
});

window.onload = () => {
    carregarEstoque();
};